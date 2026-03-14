import { PoiConnector } from '@core/connectors/poiConnector.ts'
import { osmConnector } from '@core/connectors/osmConnector.ts'
import { toStumblePoi, toSuggestionResult, deduplicatePois, filterAndRankPois, calculateFeedbackDelta, buildVisit, buildFeedback } from './stumbleService.ts'
import { StumblePoiRepository } from './stumbleStore.ts'
import { Result, StumbleApplicationContract, StumbleFeedback, StumbleFeedbackVote, StumblePreference, StumbleSuggestionResult, StumbleVisit } from '@shared/contracts/index.ts'
import { Store } from '@core/store/storeFactory.ts'
import { logger } from '@core/shared/logger.ts'

export type StumbleApplicationActions = StumbleApplicationContract

interface StumbleApplicationOptions {
  poiConnector?: PoiConnector
  poiRepository: StumblePoiRepository
  visitStore: Store<StumbleVisit>
  feedbackStore: Store<StumbleFeedback>
  maxSuggestions?: number
  defaultRadiusMeters?: number
}

/**
 * Stumble application: DB-first POI suggestions with API fallback.
 *
 * Flow:
 * 1. Query DB for POIs in radius
 * 2. If fewer than maxSuggestions → fetch from external API
 * 3. Dedup + persist new POIs
 * 4. Return top N sorted by feedbackScore
 */
export function createStumbleApplication(options: StumbleApplicationOptions): StumbleApplicationActions {
  const {
    poiConnector = osmConnector,
    poiRepository,
    visitStore,
    feedbackStore,
    maxSuggestions = 5,
    defaultRadiusMeters = 1000,
  } = options

  const getSuggestions = async (
    lat: number,
    lon: number,
    radiusMeters: number,
    preferences: StumblePreference[],
    language?: string,
  ): Promise<Result<StumbleSuggestionResult[]>> => {
    try {
      const radius = radiusMeters > 0 ? radiusMeters : defaultRadiusMeters

      // Step 1: Query DB for cached POIs in radius
      let dbPois = await poiRepository.findNearby(lat, lon, radius, maxSuggestions * 3)
      logger.info(`[Stumble] DB returned ${dbPois.length} POIs in ${radius}m radius`)

      // Step 2: If not enough POIs in DB, fetch from external API
      if (dbPois.length < maxSuggestions) {
        logger.info(`[Stumble] DB has ${dbPois.length} < ${maxSuggestions}, fetching from API`)
        const apiPois = await poiConnector.fetchPois(lat, lon, radius, preferences, language)
        const newStumblePois = apiPois
          .filter(p => p.name)
          .map(p => toStumblePoi(p))

        // Step 3: Dedup against existing DB POIs + persist new ones
        const uniqueNew = deduplicatePois(newStumblePois, dbPois)
        logger.info(`[Stumble] API returned ${apiPois.length}, ${uniqueNew.length} are new`)

        for (const poi of uniqueNew) {
          await poiRepository.upsertPoi(poi)
        }

        dbPois = [...dbPois, ...uniqueNew]
      }

      // Step 4: Filter by preferences, sort by feedbackScore, limit
      const sorted = filterAndRankPois(dbPois, preferences, maxSuggestions)
      const suggestions = sorted.map(p => toSuggestionResult(p, lat, lon))
      return { success: true, data: suggestions }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stumble suggestions'
      logger.error('[Stumble] getSuggestions error', { error: message })
      return { success: false, error: { code: 'STUMBLE_ERROR', message } }
    }
  }

  const recordVisit = async (
    accountId: string,
    poiId: string,
    spotId?: string,
  ): Promise<Result<StumbleVisit>> => {
    try {
      const visit = buildVisit(accountId, poiId, spotId)
      const result = await visitStore.create(visit)
      if (!result.success) {
        return { success: false, error: { code: 'VISIT_CREATE_ERROR', message: result.message || 'Failed to record visit' } }
      }
      return { success: true, data: result.data }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record visit'
      return { success: false, error: { code: 'VISIT_ERROR', message } }
    }
  }

  const getVisits = async (accountId: string): Promise<Result<StumbleVisit[]>> => {
    try {
      const result = await visitStore.list({ filters: { accountId } })
      if (!result.success) {
        return { success: false, error: { code: 'VISIT_LIST_ERROR', message: result.message || 'Failed to get visits' } }
      }
      return { success: true, data: result.data || [] }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get visits'
      return { success: false, error: { code: 'VISIT_ERROR', message } }
    }
  }

  const submitFeedback = async (
    accountId: string,
    poiId: string,
    vote: StumbleFeedbackVote,
  ): Promise<Result<StumbleFeedback>> => {
    try {
      const feedback = buildFeedback(accountId, poiId, vote)

      // Check for existing feedback to calculate score delta
      const existing = await feedbackStore.get(feedback.id)
      const scoreDelta = calculateFeedbackDelta(vote, existing.data?.vote)

      // Upsert feedback
      let result
      if (existing.success && existing.data) {
        result = await feedbackStore.update(feedback.id, feedback)
      } else {
        result = await feedbackStore.create(feedback)
      }

      if (!result.success) {
        return { success: false, error: { code: 'FEEDBACK_ERROR', message: result.message || 'Failed to submit feedback' } }
      }

      // Update aggregate score on POI
      if (scoreDelta !== 0) {
        await poiRepository.updateFeedbackScore(poiId, scoreDelta)
      }

      return { success: true, data: result.data }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit feedback'
      return { success: false, error: { code: 'FEEDBACK_ERROR', message } }
    }
  }

  const getFeedback = async (accountId: string): Promise<Result<StumbleFeedback[]>> => {
    try {
      const result = await feedbackStore.list({ filters: { accountId } })
      if (!result.success) {
        return { success: false, error: { code: 'FEEDBACK_LIST_ERROR', message: result.message || 'Failed to get feedback' } }
      }
      return { success: true, data: result.data || [] }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get feedback'
      return { success: false, error: { code: 'FEEDBACK_ERROR', message } }
    }
  }

  return { getSuggestions, recordVisit, getVisits, submitFeedback, getFeedback }
}
