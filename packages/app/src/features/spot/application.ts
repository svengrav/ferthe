import { logger } from '@app/shared/utils/logger'
import { CreateSpotRequest, Result, Spot, UpdateSpotRequest } from '@shared/contracts'
import type { ApiClient } from '@shared/orpc'
import { getSpotStoreActions } from './stores/spotStore'

export interface SpotApplication {
  requestSpotsByTrail: (trailId: string) => Promise<void>
  requestNearbySpots: (lat: number, lng: number, radiusMeters: number) => Promise<void>
  getSpot: (spotId: string) => Promise<Result<Spot | undefined>>
  getSpotsByIds: (spotIds: string[]) => Promise<Result<Spot[]>>
  createSpot: (request: CreateSpotRequest) => Promise<Result<Spot>>
  updateSpot: (spotId: string, updates: UpdateSpotRequest) => Promise<Result<Spot>>
  deleteSpot: (spotId: string) => Promise<Result<void>>
}

interface SpotApplicationOptions {
  api: ApiClient
}

export function createSpotApplication(options: SpotApplicationOptions): SpotApplication {
  const { api } = options
  const { setStatus, setSpots, upsertSpot, removeSpot } = getSpotStoreActions()

  const requestSpotsByTrail = async (trailId: string) => {
    setStatus('loading')
    logger.log('SpotApplication: Requesting spots by trail', trailId)

    const trailSpotsResult = await api.trails.listSpots(trailId)
    if (!trailSpotsResult.success || !trailSpotsResult.data) {
      logger.error('Failed to fetch trail spots:', trailSpotsResult.error)
      setStatus('error')
      return
    }

    const spotIds = trailSpotsResult.data.map(ts => ts.spotId)
    const spots = await api.spots.getByIds(spotIds)
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
    const result = await api.spots.getByIds(spotIds)
    if (result.success && result.data) {
      result.data.forEach(spot => upsertSpot(spot))
    }
    return result as Result<Spot[]>
  }

  const getSpot = async (spotId: string): Promise<Result<Spot | undefined>> => {
    logger.log('SpotApplication: Getting spot', spotId)
    const result = await api.spots.get(spotId)
    if (result.success && result.data) {
      upsertSpot(result.data)
    }
    return result
  }

  const createSpot = async (request: CreateSpotRequest): Promise<Result<Spot>> => {
    logger.log('SpotApplication: Creating spot', request.content.name)
    const result = await api.spots.create(request)
    if (result.success && result.data) {
      upsertSpot(result.data)
      logger.log('SpotApplication: Spot created', result.data.id)
    }
    return result as Result<Spot>
  }

  const deleteSpot = async (spotId: string): Promise<Result<void>> => {
    logger.log('SpotApplication: Deleting spot', spotId)
    const result = await api.spots.delete(spotId)
    if (result.success) {
      removeSpot(spotId)
      logger.log('SpotApplication: Spot deleted', spotId)
    }
    return result
  }

  const updateSpot = async (spotId: string, updates: UpdateSpotRequest): Promise<Result<Spot>> => {
    logger.log('SpotApplication: Updating spot', spotId)
    const result = await api.spots.update(spotId, updates)
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
  }
}
