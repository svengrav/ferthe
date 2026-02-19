import { SensorApplication } from '@app/features/sensor'
import { getSpotActions, getSpots, getSpotsById } from '@app/features/spot'
import { getTrailsById } from '@app/features/trail/stores/trailStore'
import { logger } from '@app/shared/utils/logger'
import { AccountContext, Discovery, DiscoveryApplicationContract, DiscoveryContent, DiscoveryStateCompositeContract, DiscoveryStats, RatingSummary, Result } from '@shared/contracts'
import { Unsubscribe } from '@shared/events/eventHandler'
import { GeoLocation, geoUtils } from '@shared/geo'
import { getTrails } from '../trail/stores/trailStore'
import { emitDiscoveryTrailUpdated, emitNewDiscoveries, onDiscoveryTrailUpdated, onNewDiscoveries } from './events/discoveryEvents'
import { discoveryService } from './logic/discoveryService'
import { DiscoveryEventState } from './logic/types'
import { getDiscoveryContentActions } from './stores/discoveryContentStore'
import { getDiscoveries, getDiscoveriesById, getDiscoveryActions } from './stores/discoveryStore'
import { getDiscoveryTrailActions, getDiscoveryTrailData, getDiscoveryTrailId } from './stores/discoveryTrailStore'
import { getSpotRatingActions } from './stores/spotRatingStore'

/**
 * Default discovery trail slug used when no specific trail is set.
 * This is used to initialize the discovery application with a default trail.
 */
const DEFAULT_DISCOVERY_SLUG = 'discovery-trail-2025'

export interface DiscoveryApplication {
  setActiveTrail: (id: string) => void
  requestDiscoveryState: () => Promise<void>
  onDiscoveryTrailUpdate: (handler: (state: any) => void) => Unsubscribe
  onNewDiscoveries: (handler: (discoveries: DiscoveryEventState[]) => void) => Unsubscribe
  getDiscoveryCards: () => DiscoveryEventState[]
  // Stats method
  getDiscoveryStats: (discoveryId: string) => Promise<Result<DiscoveryStats>>
  // Content methods
  upsertDiscoveryContent: (discoveryId: string, content: { imageUrl?: string; comment?: string }) => Promise<Result<DiscoveryContent>>
  deleteDiscoveryContent: (discoveryId: string) => Promise<Result<void>>
  getDiscoveryContent: (discoveryId: string) => Promise<Result<DiscoveryContent | undefined>>
  // Rating methods
  rateSpot: (spotId: string, rating: number) => Promise<Result<void>>
  removeSpotRating: (spotId: string) => Promise<Result<void>>
  getSpotRatingSummary: (spotId: string) => Promise<Result<RatingSummary>>
}

type DiscoveryApplicationOptions = {
  getAccountContext: () => Promise<Result<AccountContext>>
  sensor?: SensorApplication
  discoveryAPI: DiscoveryApplicationContract
  discoveryStateAPI: DiscoveryStateCompositeContract
}

export function createDiscoveryApplication(options: DiscoveryApplicationOptions): DiscoveryApplication {
  const { sensor, discoveryAPI, discoveryStateAPI, getAccountContext } = options
  const { getDiscoveryTrail, getDiscoveredSpots, processLocation } = discoveryAPI
  const { setDiscoveryTrail, setStatus, resetScannedClues } = getDiscoveryTrailActions()

  const thresholdState = {
    distance: 5,  // Check every 5m for smoother snap updates
    latestLocation: {
      lat: 0,
      lon: 0,
    },
  }

  const getSession = async (): Promise<Result<AccountContext>> => {
    const accountSession = await getAccountContext()
    if (!accountSession.data) return { success: false, data: undefined }
    return { success: true, data: accountSession.data }
  }

  sensor?.onScanEvent(async scanEvent => {
    if (scanEvent.clues.length > 0) {
      const accountSession = await getAccountContext()

      if (!accountSession.data) return

      const result = await getDiscoveryTrail(accountSession.data, scanEvent.trailId!)
      if (!result.data) return

      // Filter scanned clues to exclude those that are already in preview clues
      const previewClues = result.data.clues || []
      const uniqueScannedClues = scanEvent.clues.filter(
        scannedClue =>
          !previewClues.some(
            previewClue =>
              previewClue.spotId === scannedClue.spotId && previewClue.location.lat === scannedClue.location.lat && previewClue.location.lon === scannedClue.location.lon
          )
      )

      const { trail, spots, discoveries, createdAt } = result.data

      // Upsert spots and discoveries into their respective stores
      const { upsertSpot } = getSpotActions()
      spots.forEach(discoverySpot => {
        const { discoveryId, discoveredAt, ...spot } = discoverySpot
        upsertSpot(spot)
      })

      const { upsertDiscoveries } = getDiscoveryActions()
      upsertDiscoveries(discoveries)

      // Update store with normalized IDs
      const discovery = getDiscoveryTrailData()
      setDiscoveryTrail({ ...discovery, scannedClues: scanEvent.clues, updatedAt: createdAt })

      // Emit event with full denormalized data
      emitDiscoveryTrailUpdated({
        trail,
        spots,
        scannedClues: [...uniqueScannedClues],
        previewClues: [...previewClues],
        createdAt,
      })

      // Clear scanned clues after 4 seconds
      setTimeout(() => {
        const currentDiscovery = getDiscoveryTrailData()
        resetScannedClues()
        // Emit event with current spots state
        const spotsById = getSpotsById()
        const discoveriesById = getDiscoveriesById()
        const discoverySpots = currentDiscovery.spotIds
          .map(spotId => {
            const spot = spotsById[spotId]
            const discovery = (Object.values(discoveriesById) as Discovery[]).find(d => d.spotId === spotId)
            if (!spot || !discovery) return undefined
            return { ...spot, discoveryId: discovery.id, discoveredAt: discovery.discoveredAt }
          })
          .filter(Boolean) as any[]

        emitDiscoveryTrailUpdated({
          trail: currentDiscovery.trail,
          spots: discoverySpots,
          scannedClues: currentDiscovery.scannedClues,
          previewClues: currentDiscovery.previewClues,
          createdAt: currentDiscovery.updatedAt,
        })
      }, 2000)
    }
  })

  sensor?.onDeviceUpdate(device => {
    processLocationUpdate(device)
  })

  const setDefaultTrail = async () => {
    const trails = getTrails()
    const defaultTrail = trails.find(t => t.slug === DEFAULT_DISCOVERY_SLUG)
    if (!defaultTrail) throw new Error(`Default discovery trail '${DEFAULT_DISCOVERY_SLUG}' not found!`)

    await setActiveTrail(defaultTrail.id)
  }

  const setActiveTrail = async (id: string) => {
    setStatus('loading')
    const accountSession = await getSession()
    if (!accountSession.data) throw new Error('Account session not found!')

    const trailsById = getTrailsById()
    const trail = trailsById[id]
    if (!trail) return

    // Single composite call: updates profile + loads trail + spots
    const result = await discoveryStateAPI.activateTrail(accountSession.data, id)
    if (!result.data) return

    const { trail: discoveryTrailData, spots, profile } = result.data
    const { clues, discoveries, createdAt, previewClues } = discoveryTrailData

    // Upsert spots into spotStore (extract Spot data from DiscoverySpot)
    const { upsertSpot } = getSpotActions()
    spots.forEach(discoverySpot => {
      const { discoveryId, discoveredAt, ...spot } = discoverySpot
      upsertSpot(spot)
    })

    // Upsert discoveries into discoveryStore
    const { upsertDiscoveries } = getDiscoveryActions()
    upsertDiscoveries(discoveries)

    const discoveryTrail = {
      trailId: trail.id,
      updatedAt: createdAt,
      trail: trail,
      scannedClues: [],
      previewClues: [...clues, ...(previewClues || [])],
      spotIds: spots.map(s => s.id),
      discoveryIds: discoveries.map(d => d.id),
      status: 'ready' as const,
    }
    setDiscoveryTrail(discoveryTrail)

    // Emit event with full denormalized data
    emitDiscoveryTrailUpdated({
      trail,
      spots,
      scannedClues: [],
      previewClues: [...(previewClues || [])],
      createdAt,
    })
  }


  const requestDiscoveryState = async () => {
    const accountSession = await getSession()
    if (!accountSession.data) throw new Error('Account session not found!')

    // Single composite call: profile + discoveries + spots + active trail
    const stateResult = await discoveryStateAPI.getDiscoveryState(accountSession.data)

    if (stateResult.data) {
      const { profile, discoveries, spots, activeTrail } = stateResult.data

      const { setDiscoveries } = getDiscoveryActions()
      const { setSpots } = getSpotActions()

      logger.log('Fetched discovery state:', { discoveries: discoveries.length, spots: spots.length })
      setDiscoveries(discoveries)

      // Extract Spot data from DiscoverySpot and store in spotStore
      const extractedSpots = spots.map(({ discoveryId, discoveredAt, ...spot }) => spot)
      setSpots(extractedSpots)

      // Set active trail from composite response
      if (activeTrail) {
        const trailsById = getTrailsById()
        const trail = activeTrail.trail ? trailsById[activeTrail.trail.id] : undefined

        if (trail) {
          const { clues, spots: trailSpots, discoveries: trailDiscoveries, createdAt, previewClues } = activeTrail

          const { upsertSpot } = getSpotActions()
          trailSpots.forEach(discoverySpot => {
            const { discoveryId, discoveredAt, ...spot } = discoverySpot
            upsertSpot(spot)
          })

          const { upsertDiscoveries } = getDiscoveryActions()
          upsertDiscoveries(trailDiscoveries)

          setDiscoveryTrail({
            trailId: trail.id,
            updatedAt: createdAt,
            trail,
            scannedClues: [],
            previewClues: [...clues, ...(previewClues || [])],
            spotIds: trailSpots.map(s => s.id),
            discoveryIds: trailDiscoveries.map(d => d.id),
            status: 'ready' as const,
          })

          emitDiscoveryTrailUpdated({
            trail,
            spots: trailSpots,
            scannedClues: [],
            previewClues: [...(previewClues || [])],
            createdAt,
          })

          logger.log(`Discovery state loaded with active trail: ${trail.id}`)
        } else {
          await setDefaultTrail()
        }
      } else if (profile.lastActiveTrailId) {
        await setActiveTrail(profile.lastActiveTrailId)
        logger.log(`Discovery state loaded, set active trail from profile: ${profile.lastActiveTrailId}`)
      } else {
        await setDefaultTrail()
        logger.log('Discovery state loaded, default trail set.')
      }
    } else {
      // Fallback: composite failed, try default trail
      logger.error('Failed to load discovery state, falling back to default trail')
      await setDefaultTrail()
    }

    setStatus('ready')
  }

  const getDiscoveryCards = () => {
    return discoveryService.createDiscoveryCards(getDiscoveries(), getSpots())
  }

  const handleNewDiscoveries = async (
    newDiscoveries: Discovery[],
    trailId: string,
    accountContext: AccountContext,
    snap?: { distance: number; intensity: number }
  ) => {
    const { upsertDiscoveries, setDiscoveryEvent } = getDiscoveryActions()
    const { setSpots } = getSpotActions()

    upsertDiscoveries(newDiscoveries)

    const allDiscoveries = getDiscoveries()
    const allDiscoveredSpotIds = allDiscoveries.map(d => d.spotId)
    const currentTrailData = getDiscoveryTrailData()
    const allDiscoveryIds = [...currentTrailData.discoveryIds, ...newDiscoveries.map(d => d.id)]
    const filteredClues = currentTrailData.scannedClues.filter(clue => !allDiscoveredSpotIds.includes(clue.spotId))
    const filteredPreviewClues = currentTrailData.previewClues?.filter(clue => !allDiscoveredSpotIds.includes(clue.spotId))

    setDiscoveryTrail({
      ...currentTrailData,
      trail: currentTrailData.trail,
      discoveryIds: allDiscoveryIds,
      snap: snap,
      trailId: currentTrailData.trailId,
      scannedClues: filteredClues,
      previewClues: filteredPreviewClues,
      lastDiscovery: newDiscoveries[newDiscoveries.length - 1],
      updatedAt: new Date(),
    })

    await setActiveTrail(trailId)

    const discoverySpots = await getDiscoveredSpots(accountContext)
    if (discoverySpots.data) {
      // Extract Spot data from DiscoverySpot and store in spotStore
      const spots = discoverySpots.data.map(({ discoveryId, discoveredAt, ...spot }) => spot)
      setSpots(spots)
    }

    const discoveryStates = discoveryService.createDiscoveryCards(newDiscoveries, getSpots())
    setDiscoveryEvent(discoveryStates[discoveryStates.length - 1])
    emitNewDiscoveries(discoveryStates)
  }

  const processLocationUpdate = async (position: { location: GeoLocation; heading: number }) => {
    const accountSession = await getSession()
    if (!accountSession.data) throw new Error('Account session not found!')

    const { setSnap } = getDiscoveryTrailActions()
    const { status } = getDiscoveryTrailData()
    const trailId = getDiscoveryTrailId()

    if (status === 'loading' || !trailId) {
      logger.log('Processing skipped due to loading status or missing trail ID')
      return
    }

    const distance = geoUtils.calculateDistance(thresholdState.latestLocation, position.location)
    if (distance < thresholdState.distance) {
      return
    }

    // Update threshold location
    thresholdState.latestLocation = position.location

    const locationWithDirection = {
      location: position.location,
      direction: position.heading,
    }

    const locationResult = await processLocation(accountSession.data, locationWithDirection, trailId)
    if (!locationResult.data) return

    // Update snap from backend
    locationResult.data.snap && setSnap(locationResult.data.snap)

    const newDiscoveries = locationResult.data.discoveries
    if (newDiscoveries.length > 0) {
      await handleNewDiscoveries(newDiscoveries, trailId, accountSession.data, locationResult.data.snap)
    }
  }

  // Content methods
  const upsertDiscoveryContent = async (discoveryId: string, content: { imageUrl?: string; comment?: string }): Promise<Result<DiscoveryContent>> => {
    const session = await getSession()
    if (!session.data) return { success: false, data: undefined as any }

    const result = await discoveryAPI.upsertDiscoveryContent(session.data, discoveryId, content)
    if (result.data) {
      getDiscoveryContentActions().setContent(discoveryId, result.data)
    }
    return result
  }

  const getDiscoveryContent = async (discoveryId: string): Promise<Result<DiscoveryContent | undefined>> => {
    const session = await getSession()
    if (!session.data) return { success: false, data: undefined }

    const result = await discoveryAPI.getDiscoveryContent(session.data, discoveryId)
    if (result.data) {
      getDiscoveryContentActions().setContent(discoveryId, result.data)
    }
    return result
  }

  const deleteDiscoveryContent = async (discoveryId: string): Promise<Result<void>> => {
    const session = await getSession()
    if (!session.data) return { success: false, data: undefined }

    const result = await discoveryAPI.deleteDiscoveryContent(session.data, discoveryId)
    if (result.success) {
      getDiscoveryContentActions().clearContent(discoveryId)
    }
    return result
  }

  // Rating methods
  const rateSpot = async (spotId: string, rating: number): Promise<Result<void>> => {
    const session = await getSession()
    if (!session.data) return { success: false, data: undefined }

    logger.log('DiscoveryApplication: Rating spot', { spotId, rating })
    const result = await discoveryAPI.rateSpot(session.data, spotId, rating)
    if (result.success) {
      logger.log('DiscoveryApplication: Rating successful, refreshing summary')
      // Refresh rating summary
      const summaryResult = await discoveryAPI.getSpotRatingSummary(session.data, spotId)
      if (summaryResult.data) {
        logger.log('DiscoveryApplication: Updated summary', summaryResult.data)
        getSpotRatingActions().setRatingSummary(spotId, summaryResult.data)
      }
    } else {
      logger.error('DiscoveryApplication: Rating failed', result.error)
    }
    return { success: result.success, data: undefined }
  }

  const removeSpotRating = async (spotId: string): Promise<Result<void>> => {
    const session = await getSession()
    if (!session.data) return { success: false, data: undefined }

    const result = await discoveryAPI.removeSpotRating(session.data, spotId)
    if (result.success) {
      const summaryResult = await discoveryAPI.getSpotRatingSummary(session.data, spotId)
      if (summaryResult.data) {
        getSpotRatingActions().setRatingSummary(spotId, summaryResult.data)
      }
    }
    return result
  }

  const getSpotRatingSummary = async (spotId: string): Promise<Result<RatingSummary>> => {
    const session = await getSession()
    if (!session.data) return { success: false, error: undefined as any }

    const result = await discoveryAPI.getSpotRatingSummary(session.data, spotId)
    if (result.data) {
      getSpotRatingActions().setRatingSummary(spotId, result.data)
    }
    return result
  }

  const getDiscoveryStats = async (discoveryId: string): Promise<Result<DiscoveryStats>> => {
    const session = await getSession()
    if (!session.data) return {
      success: false, error: {
        message: 'Account session not found',
        code: ''
      }
    }

    return await discoveryAPI.getDiscoveryStats(session.data, discoveryId)
  }

  return {
    getDiscoveryCards,
    setActiveTrail,
    requestDiscoveryState,
    onDiscoveryTrailUpdate: onDiscoveryTrailUpdated,
    onNewDiscoveries,
    getDiscoveryStats,
    upsertDiscoveryContent,
    deleteDiscoveryContent,
    getDiscoveryContent,
    rateSpot,
    removeSpotRating,
    getSpotRatingSummary,
  }
}
