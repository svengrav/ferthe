import { PoiConnector } from '@core/connectors/poiConnector.ts'
import { osmConnector } from '@core/connectors/osmConnector.ts'
import { toSuggestionResults } from './stumbleService.ts'
import { Result, StumbleApplicationContract, StumblePreference, StumbleSuggestionResult } from '@shared/contracts/index.ts'

const DEFAULT_RADIUS_METERS = 800

export type StumbleApplicationActions = StumbleApplicationContract

/**
 * Fetches nearby POIs based on user preferences and returns
 * them as StumbleSuggestions for the client to display on the map.
 */
export function createStumbleApplication(connector: PoiConnector = osmConnector): StumbleApplicationActions {
  const getSuggestions = async (
    lat: number,
    lon: number,
    radiusMeters: number,
    preferences: StumblePreference[],
  ): Promise<Result<StumbleSuggestionResult[]>> => {
    try {
      const radius = radiusMeters > 0 ? radiusMeters : DEFAULT_RADIUS_METERS
      const pois = await connector.fetchPois(lat, lon, radius, preferences)
      const suggestions = toSuggestionResults(pois)
      return { success: true, data: suggestions }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stumble suggestions'
      return { success: false, error: { code: 'STUMBLE_ERROR', message } }
    }
  }

  return { getSuggestions }
}
