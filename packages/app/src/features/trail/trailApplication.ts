import { logger } from '@app/shared/utils/logger'
import { AccountContext, RatingSummary, Result, TrailApplicationContract, TrailStats } from '@shared/contracts'
import { getTrailRatingActions } from './stores/trailRatingStore'
import { getTrailStoreActions } from './stores/trailStore'

export interface TrailApplication {
  requestTrailState: () => Promise<void>
  requestTrailSpotPreviews: (trailId: string) => Promise<void>
  getTrailStats: (trailId: string) => Promise<Result<TrailStats>>
  rateTrail: (trailId: string, rating: number) => Promise<Result<void>>
  removeTrailRating: (trailId: string) => Promise<Result<void>>
  getTrailRatingSummary: (trailId: string) => Promise<Result<RatingSummary>>
}

interface TrailApplicationOptions {
  getAccountContext: () => Promise<Result<AccountContext>>
  trailAPI: TrailApplicationContract
}

export function createTrailApplication(options: TrailApplicationOptions) {
  const { trailAPI, getAccountContext } = options

  const getSession = async (): Promise<Result<AccountContext>> => {
    const accountSession = await getAccountContext()
    if (!accountSession.data) return { success: false, data: undefined }
    return { success: true, data: accountSession.data }
  }

  if (!trailAPI) throw new Error('Trail application dependency is required')

  const { listTrails } = trailAPI
  const { setStatus, setTrails } = getTrailStoreActions()

  const requestTrailState = async () => {
    const accountSession = await getSession()
    if (!accountSession.data) throw new Error('Account session not found!')

    setStatus('loading')
    const trails = await listTrails(accountSession.data)
    if (!trails.data || !trails.success) {
      logger.error('Failed to fetch trails:', trails.error)
      setStatus('error')
    } else {
      setTrails(trails.data)
      setStatus('ready')
    }
  }

  const requestTrailSpotPreviews = async (trailId: string) => {
    const accountSession = await getSession()
    if (!accountSession.data) throw new Error('Account session not found!')

    setStatus('loading')
    const spots = await trailAPI.listSpotPreviews(accountSession.data, trailId)
    if (!spots.data || !spots.success) {
      logger.error('Failed to fetch spots:', spots.error)
      setStatus('error')
    } else {
      // Assuming there's a method to set spots in the store
      getTrailStoreActions().setSpots(spots.data)
      setStatus('ready')
    }
  }

  const getTrailStats = async (trailId: string): Promise<Result<TrailStats>> => {
    const accountSession = await getSession()
    if (!accountSession.data) {
      return { success: false, error: { message: 'Account session not found', code: 'SESSION_NOT_FOUND' } }
    }
    return await trailAPI.getTrailStats(accountSession.data, trailId)
  }

  const rateTrail = async (trailId: string, rating: number): Promise<Result<void>> => {
    const session = await getSession()
    if (!session.data) return { success: false, data: undefined }

    logger.log('TrailApplication: Rating trail', { trailId, rating })
    const result = await trailAPI.rateTrail(session.data, trailId, rating)
    if (result.success) {
      logger.log('TrailApplication: Rating successful, refreshing summary')
      // Refresh rating summary
      const summaryResult = await trailAPI.getTrailRatingSummary(session.data, trailId)
      if (summaryResult.data) {
        logger.log('TrailApplication: Updated summary', summaryResult.data)
        getTrailRatingActions().setRatingSummary(trailId, summaryResult.data)
      }
    } else {
      logger.error('TrailApplication: Rating failed', result.error)
    }
    return { success: result.success, data: undefined }
  }

  const removeTrailRating = async (trailId: string): Promise<Result<void>> => {
    const session = await getSession()
    if (!session.data) return { success: false, data: undefined }

    const result = await trailAPI.removeTrailRating(session.data, trailId)
    if (result.success) {
      const summaryResult = await trailAPI.getTrailRatingSummary(session.data, trailId)
      if (summaryResult.data) {
        getTrailRatingActions().setRatingSummary(trailId, summaryResult.data)
      }
    }
    return result
  }

  const getTrailRatingSummary = async (trailId: string): Promise<Result<RatingSummary>> => {
    const session = await getSession()
    if (!session.data) return { success: false, error: undefined as any }

    const result = await trailAPI.getTrailRatingSummary(session.data, trailId)
    if (result.data) {
      getTrailRatingActions().setRatingSummary(trailId, result.data)
    }
    return result
  }

  return {
    requestTrailState,
    requestTrailSpotPreviews,
    getTrailStats,
    rateTrail,
    removeTrailRating,
    getTrailRatingSummary,
  }
}
