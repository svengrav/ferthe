import { detectStumbleCategory, STUMBLE_HINTS, StumbleSuggestion } from '@shared/contracts/stumble.ts'
import { OsmPoi } from '@core/connectors/osmConnector.ts'

/**
 * Converts a raw OSM POI list to StumbleSuggestions.
 * Filters out POIs without a name (too generic to be useful).
 */
export const toSuggestions = (pois: OsmPoi[]): StumbleSuggestion[] =>
  pois
    .filter(poi => poi.name)
    .map(poi => {
      const category = detectStumbleCategory(poi.tags)
      return {
        id: `osm-${poi.id}`,
        location: { lat: poi.lat, lon: poi.lon },
        name: poi.name!,
        category,
        hint: STUMBLE_HINTS[category],
      }
    })
