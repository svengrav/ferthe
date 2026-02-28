import { getSpotStoreActions } from '@app/features/spot/stores/spotStore'
import { logger } from '@app/shared/utils/logger'
import type { ApiClient } from '@shared/api'
import { RatingSummary, Result, TrailStats } from '@shared/contracts'
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
  api: ApiClient
}

export function createTrailApplication(options: TrailApplicationOptions) {
  const { api } = options
  const { setStatus, setTrails } = getTrailStoreActions()

  const requestTrailState = async () => {
    setStatus('loading')
    const trails = await api.trails.list()
    if (!trails.success || !trails.data) {
      logger.error('Failed to fetch trails:', trails.error)
      setStatus('error')
    } else {
      setTrails(trails.data)
      setStatus('ready')
    }
  }

  const requestTrailSpotPreviews = async (trailId: string) => {
    setStatus('loading')
    const trailSpotsResult = await api.trails.listSpots(trailId)
    if (!trailSpotsResult.success) {
      logger.error('Failed to fetch trail spots:', trailSpotsResult.error)
      setStatus('error')
      return
    }

    const trailSpots = trailSpotsResult.data || []
    const spotIds = trailSpots.map(ts => ts.spotId)
    const spotPreviews = trailSpots
      .filter(ts => ts.preview)
      .map(ts => ({
        id: ts.spotId,
        blurredImage: ts.preview!.blurredImage,
        rating: ts.preview!.rating,
      }))

    getSpotStoreActions().setSpotPreviews(spotPreviews)
    getTrailStoreActions().setTrailSpotIds(trailId, spotIds)
    setStatus('ready')
  }

  const getTrailStats = async (trailId: string): Promise<Result<TrailStats>> =>
    api.trails.getStats(trailId)

  const rateTrail = async (trailId: string, rating: number): Promise<Result<void>> => {
    logger.log('TrailApplication: Rating trail', { trailId, rating })
    const result = await api.trails.rate(trailId, rating)
    if (result.success) {
      const summaryResult = await api.trails.getRatingSummary(trailId)
      if (summaryResult.data) {
        getTrailRatingActions().setRatingSummary(trailId, summaryResult.data)
      }
    } else {
      logger.error('TrailApplication: Rating failed', result.error)
    }
    return { success: result.success, data: undefined }
  }

  const removeTrailRating = async (trailId: string): Promise<Result<void>> => {
    const result = await api.trails.removeRating(trailId)
    if (result.success) {
      const summaryResult = await api.trails.getRatingSummary(trailId)
      if (summaryResult.data) {
        getTrailRatingActions().setRatingSummary(trailId, summaryResult.data)
      }
    }
    return result
  }

  const getTrailRatingSummary = async (trailId: string): Promise<Result<RatingSummary>> => {
    const result = await api.trails.getRatingSummary(trailId)
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
