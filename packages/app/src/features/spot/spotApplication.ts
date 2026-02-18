import { logger } from '@app/shared/utils/logger'
import { AccountContext, Result, Spot, SpotApplicationContract, TrailApplicationContract } from '@shared/contracts'
import { getSpotStoreActions } from './stores/spotStore'

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

    const spots = await trailAPI.listSpots(accountSession.data, trailId)
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
    return await spotAPI.getSpot(accountSession.data, spotId)
  }

  return {
    requestSpotsByTrail,
    requestNearbySpots,
    getSpot,
  }
}
