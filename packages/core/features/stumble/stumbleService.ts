import { StumbleSuggestionResult } from '@shared/contracts/stumble.ts'
import { Poi } from '@core/connectors/poiConnector.ts'

/**
 * Converts a provider-independent Poi list to StumbleSuggestionResults.
 * Filters out POIs without a name (too generic to be useful).
 * poi.category reflects the matched preference (why this POI was returned).
 */
export const toSuggestionResults = (pois: Poi[]): StumbleSuggestionResult[] =>
  pois
    .filter(poi => poi.name)
    .map(poi => ({
      id: `poi-${poi.id}`,
      location: { lat: poi.lat, lon: poi.lon },
      name: poi.name!,
      category: poi.category,
      ...(poi.tags?.length ? { tags: poi.tags } : {}),
      ...(poi.osmId ? { osmId: poi.osmId } : {}),
      ...(poi.address ? { address: poi.address } : {}),
    }))
