import { SensorApplication } from '@app/features/sensor'
import { getSpotStoreActions as getSpotActions, getSpots, getSpotsById } from '@app/features/spot/stores/spotStore'
import { getTrailsById } from '@app/features/trail/stores/trailStore'
import { logger } from '@app/shared/utils/logger'
import type { ApiClient } from '@shared/api'
import { Discovery, DiscoveryContent, DiscoveryContentVisibility, DiscoveryStats, RatingSummary, Result, SpotSummary } from '@shared/contracts'
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
  upsertDiscoveryContent: (discoveryId: string, content: { imageUrl?: string; comment?: string; visibility?: DiscoveryContentVisibility }) => Promise<Result<DiscoveryContent>>
  deleteDiscoveryContent: (discoveryId: string) => Promise<Result<void>>
  getDiscoveryContent: (discoveryId: string) => Promise<Result<DiscoveryContent | undefined>>
  // Rating methods
  rateSpot: (spotId: string, rating: number) => Promise<Result<void>>
  removeSpotRating: (spotId: string) => Promise<Result<void>>
  getSpotRatingSummary: (spotId: string) => Promise<Result<RatingSummary>>
  // Welcome Discovery
  createWelcomeDiscovery: (location: GeoLocation) => Promise<Result<DiscoveryEventState>>
  // Spot Screen
  requestSpotScreenData: () => Promise<void>
}

interface DiscoveryApplicationOptions {
  api: ApiClient
  sensor?: SensorApplication
}

export function createDiscoveryApplication(options: DiscoveryApplicationOptions): DiscoveryApplication {
  const { api, sensor } = options
  const { setDiscoveryTrail, setStatus, resetScannedClues } = getDiscoveryTrailActions()

  const thresholdState = {
    distance: 5,
    latestLocation: { lat: 0, lon: 0 },
  }

  sensor?.onScanEvent(async scanEvent => {
    if (scanEvent.clues.length > 0) {
      const result = await api.discovery.getTrail(scanEvent.trailId!)
      if (!result.data) return

      const previewClues = result.data.clues || []
      const uniqueScannedClues = scanEvent.clues.filter(
        scannedClue =>
          !previewClues.some(
            previewClue =>
              previewClue.spotId === scannedClue.spotId &&
              previewClue.location.lat === scannedClue.location.lat &&
              previewClue.location.lon === scannedClue.location.lon
          )
      )

      const { trail, spots, discoveries, createdAt } = result.data

      const { upsertSpot } = getSpotActions()
      spots.forEach(discoverySpot => {
        const { discoveryId, discoveredAt, ...spot } = discoverySpot
        upsertSpot(spot)
      })

      const { upsertDiscoveries } = getDiscoveryActions()
      upsertDiscoveries(discoveries)

      const discovery = getDiscoveryTrailData()
      setDiscoveryTrail({ ...discovery, scannedClues: scanEvent.clues, updatedAt: createdAt })

      emitDiscoveryTrailUpdated({
        trail,
        spots,
        scannedClues: [...uniqueScannedClues],
        previewClues: [...previewClues],
        createdAt,
      })

      setTimeout(() => {
        const currentDiscovery = getDiscoveryTrailData()
        resetScannedClues()
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
    if (trails.length === 0) {
      logger.warn('setDefaultTrail: no trails loaded yet.')
      return
    }

    const defaultTrail = trails.find(t => t.slug === DEFAULT_DISCOVERY_SLUG) ?? trails[0]
    if (defaultTrail.slug !== DEFAULT_DISCOVERY_SLUG) {
      logger.warn(`Default trail '${DEFAULT_DISCOVERY_SLUG}' not found, falling back to '${defaultTrail.slug}'`)
    }

    await setActiveTrail(defaultTrail.id)
  }

  const setActiveTrail = async (id: string) => {
    setStatus('loading')
    const trailsById = getTrailsById()
    const trail = trailsById[id]
    if (!trail) return

    const result = await api.composite.activateTrail(id)
    if (!result.data) return

    const { activeTrail, spots, discoveries } = result.data

    const { upsertSpot } = getSpotActions()
    spots.forEach(spot => upsertSpot(toSpot(spot)))

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

  // Convert SpotSummary to Spot shape for the store
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
    const stateResult = await api.composite.getDiscoveryState()

    if (stateResult.data) {
      const { lastActiveTrailId, discoveries, spots, activeTrail } = stateResult.data

      const { setDiscoveries } = getDiscoveryActions()
      const { setSpots } = getSpotActions()

      logger.log('Fetched discovery state:', { discoveries: discoveries.length, spots: spots.length })
      setDiscoveries(discoveries as Discovery[])
      setSpots(spots.map(toSpot))

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
      logger.error('Failed to load discovery state, falling back to default trail')
      await setDefaultTrail()
    }

    setStatus('ready')
  }

  const getDiscoveryCards = () =>
    discoveryService.createDiscoveryCards(getDiscoveries(), getSpots())

  const handleNewDiscoveries = async (
    newDiscoveries: Discovery[],
    trailId: string,
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
      snap,
      trailId: currentTrailData.trailId,
      scannedClues: filteredClues,
      previewClues: filteredPreviewClues,
      lastDiscoveryId: newDiscoveries[newDiscoveries.length - 1]?.id,
      updatedAt: new Date(),
    })

    await setActiveTrail(trailId)

    const discoverySpots = await api.discovery.listSpots()
    if (discoverySpots.data) {
      const spots = discoverySpots.data.map(({ discoveryId, discoveredAt, ...spot }) => spot)
      setSpots(spots)
    }

    const discoveryStates = discoveryService.createDiscoveryCards(newDiscoveries, getSpots())
    setDiscoveryEvent(discoveryStates[discoveryStates.length - 1])
    emitNewDiscoveries(discoveryStates)
  }

  const processLocationUpdate = async (position: { location: GeoLocation; heading: number }) => {
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

    thresholdState.latestLocation = position.location

    const locationWithDirection = {
      location: position.location,
      direction: position.heading,
    }

    const locationResult = await api.discovery.processLocation(trailId, locationWithDirection)
    if (!locationResult.data) return

    locationResult.data.snap && setSnap(locationResult.data.snap)

    const newDiscoveries = locationResult.data.discoveries
    if (newDiscoveries.length > 0) {
      await handleNewDiscoveries(newDiscoveries, trailId, locationResult.data.snap)
    }
  }

  // Content methods
  const upsertDiscoveryContent = async (
    discoveryId: string,
    content: { imageUrl?: string; comment?: string; visibility?: DiscoveryContentVisibility }
  ): Promise<Result<DiscoveryContent>> => {
    const result = await api.discovery.upsertContent(discoveryId, content)
    if (result.data) {
      getDiscoveryContentActions().setContent(discoveryId, result.data)
    }
    return result
  }

  const getDiscoveryContent = async (discoveryId: string): Promise<Result<DiscoveryContent | undefined>> => {
    const result = await api.discovery.getContent(discoveryId)
    if (result.data) {
      getDiscoveryContentActions().setContent(discoveryId, result.data)
    }
    return result
  }

  const deleteDiscoveryContent = async (discoveryId: string): Promise<Result<void>> => {
    const result = await api.discovery.deleteContent(discoveryId)
    if (result.success) {
      getDiscoveryContentActions().clearContent(discoveryId)
    }
    return result
  }

  // Rating methods
  const rateSpot = async (spotId: string, rating: number): Promise<Result<void>> => {
    logger.log('DiscoveryApplication: Rating spot', { spotId, rating })
    const result = await api.spots.rate(spotId, rating)
    if (result.success) {
      logger.log('DiscoveryApplication: Rating successful, refreshing summary')
      const summaryResult = await api.spots.getRatingSummary(spotId)
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
    const result = await api.spots.removeRating(spotId)
    if (result.success) {
      const summaryResult = await api.spots.getRatingSummary(spotId)
      if (summaryResult.data) {
        getSpotRatingActions().setRatingSummary(spotId, summaryResult.data)
      }
    }
    return result
  }

  const getSpotRatingSummary = async (spotId: string): Promise<Result<RatingSummary>> => {
    const result = await api.spots.getRatingSummary(spotId)
    if (result.data) {
      getSpotRatingActions().setRatingSummary(spotId, result.data)
    }
    return result
  }

  const getDiscoveryStats = async (discoveryId: string): Promise<Result<DiscoveryStats>> =>
    api.discovery.getStats(discoveryId)

  const createWelcomeDiscovery = async (location: GeoLocation): Promise<Result<DiscoveryEventState>> => {
    const result = await api.discovery.createWelcome(location)
    if (!result.success || !result.data) return { success: false, error: result.error }

    const { discovery, spot } = result.data

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

  const requestSpotScreenData = async (): Promise<void> => {
    const result = await api.composite.getDiscoveryState()
    if (result.data?.spots) {
      const { upsertSpot } = getSpotActions()
      result.data.spots.forEach(spot => upsertSpot(toSpot(spot)))
    }
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
    requestSpotScreenData,
  }
}
