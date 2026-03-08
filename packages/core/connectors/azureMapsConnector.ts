import { StumblePreference } from '@shared/contracts/stumble.ts'
import { Poi, PoiConnector } from './poiConnector.ts'

// ──────────────────────────────────────────────────────────────
// Azure Maps category ID mapping
// Docs: https://learn.microsoft.com/en-us/rest/api/maps/search
// ──────────────────────────────────────────────────────────────

const CATEGORY_IDS: Record<StumblePreference, number[]> = {
  historical: [7347, 9902],    // Monument/Memorial + Historical Monument
  cafe: [9996005],      // Coffee and Tea House
  art: [7315036],      // Museum
  architecture: [9663],         // Building/Landmark
  nature: [7321, 4170009],// Park and Recreation Area + Natural Reserve
  street_art: [7315025],      // Art Gallery
}

/** Reverse-detect category from Azure Maps categorySet IDs */
const detectCategory = (ids: number[]): StumblePreference => {
  const set = new Set(ids)
  if ([7347, 9902].some(id => set.has(id))) return 'historical'
  if (set.has(9996005)) return 'cafe'
  if (set.has(7315036)) return 'art'
  if (set.has(9663)) return 'architecture'
  if ([7321, 4170009].some(id => set.has(id))) return 'nature'
  if (set.has(7315025)) return 'street_art'
  return 'historical'
}

// ──────────────────────────────────────────────────────────────
// Azure Maps POI Search response types (internal)
// ──────────────────────────────────────────────────────────────

interface AzurePoiResult {
  id: string
  poi: { name: string; categorySet?: { id: number }[] }
  position: { lat: number; lon: number }
}

interface AzureSearchResponse {
  results: AzurePoiResult[]
}

// ──────────────────────────────────────────────────────────────
// Connector
// ──────────────────────────────────────────────────────────────

const BASE_URL = 'https://atlas.microsoft.com/search/nearby/json'
const MAX_RESULTS = 50

export function createAzureMapsConnector(apiKey: string): PoiConnector {
  return {
    fetchPois: async (
      lat: number,
      lon: number,
      radiusMeters: number,
      preferences: StumblePreference[],
    ): Promise<Poi[]> => {
      const categoryIds = [...new Set(preferences.flatMap(p => CATEGORY_IDS[p]))]
      if (categoryIds.length === 0) return []

      const params = new URLSearchParams({
        'api-version': '1.0',
        'subscription-key': apiKey,
        lat: String(lat),
        lon: String(lon),
        radius: String(radiusMeters),
        categorySet: categoryIds.join(','),
        limit: String(MAX_RESULTS),
        language: 'en-US',
      })

      const response = await fetch(`${BASE_URL}?${params}`)

      if (!response.ok) {
        throw new Error(`Azure Maps API error: ${response.status}`)
      }

      const json: AzureSearchResponse = await response.json()

      const allowedCategories = new Set(preferences)

      return (json.results ?? [])
        .map(result => {
          const ids = result.poi.categorySet?.map(c => c.id) ?? []
          return {
            id: result.id,
            lat: result.position.lat,
            lon: result.position.lon,
            name: result.poi.name,
            category: detectCategory(ids),
          }
        })
        .filter(poi => allowedCategories.has(poi.category))
    },
  }
}