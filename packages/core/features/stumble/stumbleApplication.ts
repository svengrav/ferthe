import { PoiConnector } from '@core/connectors/poiConnector.ts'
import { osmConnector } from '@core/connectors/osmConnector.ts'
import { toSuggestionResults } from './stumbleService.ts'
import { Result, StumbleApplicationContract, StumblePreference, StumbleSuggestionResult, StumbleVisit } from '@shared/contracts/index.ts'
import { Store } from '@core/store/storeFactory.ts'
import { createDeterministicId } from '@core/utils/idGenerator.ts'

const DEFAULT_RADIUS_METERS = 800

export type StumbleApplicationActions = StumbleApplicationContract

interface StumbleApplicationOptions {
  poiConnector?: PoiConnector
  visitStore: Store<StumbleVisit>
}

/**
 * Fetches nearby POIs based on user preferences and returns
 * them as StumbleSuggestions for the client to display on the map.
 */
export function createStumbleApplication(options: StumbleApplicationOptions): StumbleApplicationActions {
  const { poiConnector = osmConnector, visitStore } = options

  const getSuggestions = async (
    lat: number,
    lon: number,
    radiusMeters: number,
    preferences: StumblePreference[],
  ): Promise<Result<StumbleSuggestionResult[]>> => {
    try {
      const radius = radiusMeters > 0 ? radiusMeters : DEFAULT_RADIUS_METERS
      const pois = await poiConnector.fetchPois(lat, lon, radius, preferences)
      const suggestions = toSuggestionResults(pois)
      return { success: true, data: suggestions }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stumble suggestions'
      return { success: false, error: { code: 'STUMBLE_ERROR', message } }
    }
  }

  const recordVisit = async (
    accountId: string,
    poiId: string,
    spotId?: string,
  ): Promise<Result<StumbleVisit>> => {
    try {
      const visit: StumbleVisit = {
        id: createDeterministicId(accountId, poiId),
        poiId,
        accountId,
        visitedAt: Date.now(),
        spotId,
      }
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

  return { getSuggestions, recordVisit, getVisits }
}
