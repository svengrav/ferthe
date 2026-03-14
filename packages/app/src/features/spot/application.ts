import { logger } from '@app/shared/utils/logger'
import type { ApiClient } from '@shared/api'
import { CreateSpotRequest, DiscoverySpot, Result, Spot, UpdateSpotRequest } from '@shared/contracts'
import { getSpotStoreActions, getSpots } from './stores/spotStore'

export interface SpotApplication {
  requestSpotsByTrail: (trailId: string) => Promise<void>
  requestNearbySpots: (lat: number, lng: number, radiusMeters: number) => Promise<void>
  getSpot: (spotId: string) => Promise<Result<Spot | undefined>>
  getSpotsByIds: (spotIds: string[]) => Promise<Result<Spot[]>>
  createSpot: (request: CreateSpotRequest) => Promise<Result<Spot>>
  updateSpot: (spotId: string, updates: UpdateSpotRequest) => Promise<Result<Spot>>
  deleteSpot: (spotId: string) => Promise<Result<void>>
  fetchDiscoveredSpots: (query: { limit: number; cursor?: string }) => Promise<Result<DiscoverySpot[]>>
  handleDiscoveredSpots: (items: DiscoverySpot[], isRefresh: boolean) => void
}

interface SpotApplicationOptions {
  api: ApiClient
}

export function createSpotApplication(options: SpotApplicationOptions): SpotApplication {
  const { api } = options
  const { setStatus, setSpots, upsertSpot, removeSpot } = getSpotStoreActions()

  const fetchDiscoveredSpots = (query: { limit: number; cursor?: string }) =>
    api.discovery.listDiscoveredSpots(query)

  const handleDiscoveredSpots = (items: DiscoverySpot[], isRefresh: boolean) => {
    if (isRefresh) {
      const createdSpots = getSpots().filter(s => s.source === 'created')
      setSpots(createdSpots)
    }
    items.forEach(({ discoveryId, discoveredAt, ...spot }) => {
      upsertSpot({ ...spot, source: spot.source ?? 'discovery' } as any)
    })
  }

  const requestSpotsByTrail = async (trailId: string) => {
    setStatus('loading')
    logger.log('SpotApplication: Requesting spots by trail', trailId)

    const trailSpotsResult = await api.trail.getTrailSpots(trailId)
    if (!trailSpotsResult.success || !trailSpotsResult.data) {
      logger.error('Failed to fetch trail spots:', trailSpotsResult.error)
      setStatus('error')
      return
    }

    const spotIds = trailSpotsResult.data.map(ts => ts.spotId)
    const spots = await api.spot.getSpotsByIds(spotIds)
    if (!spots.success || !spots.data) {
      logger.error('Failed to fetch spots by trail:', spots.error)
      setStatus('error')
    } else {
      setSpots(spots.data)
      setStatus('ready')
    }
  }

  const requestNearbySpots = async (_lat: number, _lng: number, _radiusMeters: number) => {
    setStatus('loading')
    // TODO: implement nearby spots endpoint
    setStatus('ready')
  }

  const getSpotsByIds = async (spotIds: string[]): Promise<Result<Spot[]>> => {
    if (spotIds.length === 0) return { success: true, data: [] }
    const result = await api.spot.getSpotsByIds(spotIds)
    if (result.success && result.data) {
      result.data.forEach(spot => upsertSpot(spot))
    }
    return result as Result<Spot[]>
  }

  const getSpot = async (spotId: string): Promise<Result<Spot | undefined>> => {
    logger.log('SpotApplication: Getting spot', spotId)
    const result = await api.spot.getSpot(spotId)
    if (result.success && result.data) {
      // Only upsert if it's a full Spot, not a SpotPreview
      if ('name' in result.data) {
        upsertSpot(result.data)
      }
    }
    return result as Result<Spot | undefined>
  }

  const createSpot = async (request: CreateSpotRequest): Promise<Result<Spot>> => {
    logger.log('SpotApplication: Creating spot', request.content.name)
    const result = await api.spot.createSpot(request)
    if (result.success && result.data) {
      upsertSpot({ ...result.data, source: 'created' })
      logger.log('SpotApplication: Spot created', result.data.id)
    }
    return result as Result<Spot>
  }

  const deleteSpot = async (spotId: string): Promise<Result<void>> => {
    logger.log('SpotApplication: Deleting spot', spotId)
    const result = await api.spot.deleteSpot(spotId)
    if (result.success) {
      removeSpot(spotId)
      logger.log('SpotApplication: Spot deleted', spotId)
    }
    return result
  }

  const updateSpot = async (spotId: string, updates: UpdateSpotRequest): Promise<Result<Spot>> => {
    logger.log('SpotApplication: Updating spot', spotId)
    const result = await api.spot.updateSpot(spotId, updates)
    if (result.success && result.data) {
      upsertSpot(result.data)
      logger.log('SpotApplication: Spot updated', result.data.id)
    }
    return result as Result<Spot>
  }

  return {
    requestSpotsByTrail,
    requestNearbySpots,
    getSpot,
    getSpotsByIds,
    createSpot,
    updateSpot,
    deleteSpot,
    fetchDiscoveredSpots,
    handleDiscoveredSpots,
  }
}
