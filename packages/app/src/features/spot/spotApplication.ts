import { logger } from '@app/shared/utils/logger'
import { AccountContext, Result, Spot, SpotApplicationContract, TrailApplicationContract } from '@shared/contracts'
import { getSpots, getSpotStoreActions } from './stores/spotStore'

export interface SpotApplication {
  requestSpotsByTrail: (trailId: string) => Promise<void>
  requestNearbySpots: (lat: number, lng: number, radiusMeters: number) => Promise<void>
  getSpot: (spotId: string) => Promise<Result<Spot | undefined>>
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

  const { setStatus, setSpots } = getSpotStoreActions()

  const requestSpotsByTrail = async (trailId: string) => {
    const accountSession = await getSession()
    if (!accountSession.data) throw new Error('Account session not found!')

    setStatus('loading')
    logger.log('SpotApplication: Requesting spots by trail', trailId)

    const spotIdsResult = await trailAPI.getTrailSpotIds(accountSession.data, trailId)
    if (!spotIdsResult.data || !spotIdsResult.success) {
      logger.error('Failed to fetch spot IDs by trail:', spotIdsResult.error)
      setStatus('error')
      return
    }

    const spots = await spotAPI.getSpotsByIds(accountSession.data, spotIdsResult.data)
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

  const getSpot = async (spotId: string): Promise<Result<Spot | undefined>> => {
    const accountSession = await getSession()
    if (!accountSession.data) {
      return { success: false, error: { message: 'Account session not found', code: 'SESSION_NOT_FOUND' } }
    }

    logger.log('SpotApplication: Getting spot', spotId)
    const result = await spotAPI.getSpot(accountSession.data, spotId)

    // Update store with fetched spot
    if (result.success && result.data) {
      const currentSpots = getSpots()
      const otherSpots = currentSpots.filter(s => s.id !== spotId)
      setSpots([...otherSpots, result.data])
    }

    return result
  }

  return {
    requestSpotsByTrail,
    requestNearbySpots,
    getSpot,
  }
}
