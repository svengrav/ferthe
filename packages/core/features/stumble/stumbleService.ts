import { STUMBLE_HINTS, StumbleSuggestion } from '@shared/contracts/stumble.ts'
import { Poi } from '@core/connectors/poiConnector.ts'

/**
 * Converts a provider-independent Poi list to StumbleSuggestions.
 * Filters out POIs without a name (too generic to be useful).
 */
export const toSuggestions = (pois: Poi[]): StumbleSuggestion[] =>
  pois
    .filter(poi => poi.name)
    .map(poi => ({
      id: `poi-${poi.id}`,
      location: { lat: poi.lat, lon: poi.lon },
      name: poi.name!,
      category: poi.category,
      hint: STUMBLE_HINTS[poi.category],
    }))
