import { logger } from '@app/shared/utils/logger'
import { AccountContext, CreateSpotRequest, Result, Spot, SpotApplicationContract, TrailApplicationContract, UpdateSpotRequest } from '@shared/contracts'
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
  getAccountContext: () => Promise<Result<AccountContext>>
  spotAPI: SpotApplicationContract
  trailAPI: TrailApplicationContract
}

export function createSpotApplication(options: SpotApplicationOptions): SpotApplication {
  const { spotAPI, trailAPI, getAccountContext } = options

  const getSession = async (): Promise<Result<AccountContext>> => {
    const accountSession = await getAccountContext()
    if (!accountSession.data) return { success: false, data: undefined }
    return { success: true, data: accountSession.data }
  }

  if (!spotAPI) throw new Error('Spot application dependency is required')
  if (!trailAPI) throw new Error('Trail application dependency is required')

  const { setStatus, setSpots, upsertSpot, removeSpot } = getSpotStoreActions()

  const requestSpotsByTrail = async (trailId: string) => {
    const accountSession = await getSession()
    if (!accountSession.data) throw new Error('Account session not found!')

    setStatus('loading')
    logger.log('SpotApplication: Requesting spots by trail', trailId)

    const trailSpotsResult = await trailAPI.getTrailSpots(accountSession.data, trailId)
    if (!trailSpotsResult.data || !trailSpotsResult.success) {
      logger.error('Failed to fetch trail spots:', trailSpotsResult.error)
      setStatus('error')
      return
    }

    const spotIds = trailSpotsResult.data.map(ts => ts.spotId)
    const spots = await spotAPI.getSpotsByIds(accountSession.data, spotIds)
    if (!spots.data || !spots.success) {
      logger.error('Failed to fetch spots by trail:', spots.error)
      setStatus('error')
    } else {
      setSpots(spots.data)
      setStatus('ready')
    }
  }

  const requestNearbySpots = async (lat: number, lng: number, radiusMeters: number) => {
    const accountSession = await getSession()
    if (!accountSession.data) throw new Error('Account session not found!')

    setStatus('loading')
    logger.log('SpotApplication: Requesting nearby spots', { lat, lng, radiusMeters })

    // TODO: Implement API call for nearby spots
    // const spots = await spotAPI.getNearbySpots(accountSession.data, lat, lng, radiusMeters)
    // if (!spots.data || !spots.success) {
    //   logger.error('Failed to fetch nearby spots:', spots.error)
    //   setStatus('error')
    // } else {
    //   setSpots(spots.data)
    //   setStatus('ready')
    // }

    setStatus('ready')
  }

  const getSpotsByIds = async (spotIds: string[]): Promise<Result<Spot[]>> => {
    if (spotIds.length === 0) return { success: true, data: [] }

    const accountSession = await getSession()
    if (!accountSession.data) {
      return { success: false, error: { message: 'Account session not found', code: 'SESSION_NOT_FOUND' } }
    }

    const result = await spotAPI.getSpotsByIds(accountSession.data, spotIds)
    if (result.success && result.data) {
      result.data.forEach(spot => upsertSpot(spot))
    }
    return result as Result<Spot[]>
  }

  const getSpot = async (spotId: string): Promise<Result<Spot | undefined>> => {
    const accountSession = await getSession()
    if (!accountSession.data) {
      return { success: false, error: { message: 'Account session not found', code: 'SESSION_NOT_FOUND' } }
    }

    logger.log('SpotApplication: Getting spot', spotId)
    const result = await spotAPI.getSpot(accountSession.data, spotId)

    // Update store with fetched spot
    if (result.success && result.data) {
      upsertSpot(result.data)
    }

    return result
  }

  const createSpot = async (request: CreateSpotRequest): Promise<Result<Spot>> => {
    const accountSession = await getSession()
    if (!accountSession.data) {
      return { success: false, error: { message: 'Account session not found', code: 'SESSION_NOT_FOUND' } }
    }

    logger.log('SpotApplication: Creating spot', request.content.name)

    const result = await spotAPI.createSpot(accountSession.data, request)

    if (result.success && result.data) {
      upsertSpot(result.data)
      logger.log('SpotApplication: Spot created', result.data.id)
    }

    return result as Result<Spot>
  }

  const deleteSpot = async (spotId: string): Promise<Result<void>> => {
    const accountSession = await getSession()
    if (!accountSession.data) {
      return { success: false, error: { message: 'Account session not found', code: 'SESSION_NOT_FOUND' } }
    }

    logger.log('SpotApplication: Deleting spot', spotId)

    const result = await spotAPI.deleteSpot(accountSession.data, spotId)

    if (result.success) {
      removeSpot(spotId)
      logger.log('SpotApplication: Spot deleted', spotId)
    }

    return result
  }

  const updateSpot = async (spotId: string, updates: UpdateSpotRequest): Promise<Result<Spot>> => {
    const accountSession = await getSession()
    if (!accountSession.data) {
      return { success: false, error: { message: 'Account session not found', code: 'SESSION_NOT_FOUND' } }
    }

    logger.log('SpotApplication: Updating spot', spotId)

    const result = await spotAPI.updateSpot(accountSession.data, spotId, updates)

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
