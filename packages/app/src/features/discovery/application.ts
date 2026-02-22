import { SensorApplication } from '@app/features/sensor'
import { getSpotStoreActions as getSpotActions, getSpots, getSpotsById } from '@app/features/spot/stores/spotStore'
import { getTrailsById } from '@app/features/trail/stores/trailStore'
import { logger } from '@app/shared/utils/logger'
import { AccountContext, Discovery, DiscoveryApplicationContract, DiscoveryContent, DiscoveryStateCompositeContract, DiscoveryStats, RatingSummary, Result, SpotSummary } from '@shared/contracts'
import { Unsubscribe } from '@shared/events/eventHandler'
import { GeoLocation, geoUtils } from '@shared/geo'
import { getTrails } from '../trail/stores/trailStore'
import { emitDiscoveryTrailUpdated, emitNewDiscoveries, onDiscoveryTrailUpdated, onNewDiscoveries } from './events/discoveryEvents'
import { discoveryService } from './services/discoveryService'
import { DiscoveryEventState } from './services/types'
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
  // Welcome Discovery
  createWelcomeDiscovery: (location: GeoLocation) => Promise<Result<DiscoveryEventState>>
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

        const trail = currentDiscovery.trailId ? getTrailsById()[currentDiscovery.trailId] : undefined
        emitDiscoveryTrailUpdated({
          trail,
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

    const { activeTrail, spots, discoveries } = result.data

    // Upsert spots into spotStore
    const { upsertSpot } = getSpotActions()
    spots.forEach(spot => upsertSpot(toSpot(spot)))

    // Upsert discoveries into discoveryStore
    const { upsertDiscoveries } = getDiscoveryActions()
    upsertDiscoveries(discoveries as Discovery[])

    setDiscoveryTrail({
      trailId: trail.id,
      updatedAt: activeTrail.createdAt,
      scannedClues: [],
      previewClues: [...activeTrail.clues, ...activeTrail.previewClues],
      spotIds: activeTrail.spotIds,
      discoveryIds: activeTrail.discoveryIds,
      status: 'ready' as const,
    })
    // Emit event with denormalized data from stores
    const spotsById = getSpotsById()
    const discoveriesById = getDiscoveriesById()
    const trailSpots = activeTrail.spotIds
      .map(spotId => {
        const spot = spotsById[spotId]
        const discovery = (Object.values(discoveriesById) as Discovery[]).find(d => d.spotId === spotId)
        if (!spot || !discovery) return undefined
        return { ...spot, discoveryId: discovery.id, discoveredAt: discovery.discoveredAt }
      })
      .filter(Boolean) as any[]

    emitDiscoveryTrailUpdated({
      trail,
      spots: trailSpots,
      scannedClues: [],
      previewClues: [...activeTrail.previewClues],
      createdAt: activeTrail.createdAt,
    })
  }


  // Convert SpotSummary to Spot shape for the store (fill defaults for backend-only fields)
  const toSpot = (summary: SpotSummary) => ({
    id: summary.id,
    slug: '',
    name: summary.name,
    description: summary.description,
    image: summary.image,
    blurredImage: summary.blurredImage,
    location: summary.location,
    options: { discoveryRadius: 0, clueRadius: 0 },
    source: summary.source as any,
    createdAt: summary.createdAt,
    updatedAt: summary.createdAt,
  })

  const requestDiscoveryState = async () => {
    const accountSession = await getSession()
    if (!accountSession.data) throw new Error('Account session not found!')

    // Single composite call: profile + discoveries + spots + active trail (normalized)
    const stateResult = await discoveryStateAPI.getDiscoveryState(accountSession.data)

    if (stateResult.data) {
      const { lastActiveTrailId, discoveries, spots, activeTrail } = stateResult.data

      const { setDiscoveries } = getDiscoveryActions()
      const { setSpots } = getSpotActions()

      logger.log('Fetched discovery state:', { discoveries: discoveries.length, spots: spots.length })
      setDiscoveries(discoveries as Discovery[])
      setSpots(spots.map(toSpot))

      // Set active trail from normalized ID references
      if (activeTrail) {
        const trailsById = getTrailsById()
        const trail = trailsById[activeTrail.trailId]

        if (trail) {
          setDiscoveryTrail({
            trailId: trail.id,
            updatedAt: activeTrail.createdAt,
            scannedClues: [],
            previewClues: [...activeTrail.clues, ...activeTrail.previewClues],
            spotIds: activeTrail.spotIds,
            discoveryIds: activeTrail.discoveryIds,
            status: 'ready' as const,
          })

          // Emit event with denormalized data from stores
          const spotsById = getSpotsById()
          const discoveriesById = getDiscoveriesById()
          const trailSpots = activeTrail.spotIds
            .map(spotId => {
              const spot = spotsById[spotId]
              const discovery = (Object.values(discoveriesById) as Discovery[]).find(d => d.spotId === spotId)
              if (!spot || !discovery) return undefined
              return { ...spot, discoveryId: discovery.id, discoveredAt: discovery.discoveredAt }
            })
            .filter(Boolean) as any[]

          emitDiscoveryTrailUpdated({
            trail,
            spots: trailSpots,
            scannedClues: [],
            previewClues: [...activeTrail.previewClues],
            createdAt: activeTrail.createdAt,
          })

          logger.log(`Discovery state loaded with active trail: ${trail.id}`)
        } else {
          await setDefaultTrail()
        }
      } else if (lastActiveTrailId) {
        await setActiveTrail(lastActiveTrailId)
        logger.log(`Discovery state loaded, set active trail from profile: ${lastActiveTrailId}`)
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
      discoveryIds: allDiscoveryIds,
      snap: snap,
      trailId: currentTrailData.trailId,
      scannedClues: filteredClues,
      previewClues: filteredPreviewClues,
      lastDiscoveryId: newDiscoveries[newDiscoveries.length - 1]?.id,
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

  const createWelcomeDiscovery = async (location: GeoLocation): Promise<Result<DiscoveryEventState>> => {
    const session = await getSession()
    if (!session.data) return { success: false, error: { message: 'Account session not found', code: 'SESSION_NOT_FOUND' } }

    const result = await discoveryAPI.createWelcomeDiscovery(session.data, location)
    if (!result.success || !result.data) return { success: false, error: result.error }

    const { discovery, spot } = result.data

    // Persist in local stores
    const { upsertSpot } = getSpotActions()
    const { upsertDiscoveries, setDiscoveryEvent } = getDiscoveryActions()
    upsertSpot(spot)
    upsertDiscoveries([discovery])

    const cards = discoveryService.createDiscoveryCards([discovery], getSpots())
    const card = cards[0]
    setDiscoveryEvent(card)
    emitNewDiscoveries([card])

    return { success: true, data: card }
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
    createWelcomeDiscovery,
  }
}
