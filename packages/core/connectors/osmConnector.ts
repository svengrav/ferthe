import { StumblePreference, STUMBLE_OSM_FILTERS, detectStumbleCategory } from '@shared/contracts/stumble.ts'
import { Poi, PoiConnector } from './poiConnector.ts'

// ──────────────────────────────────────────────────────────────
// Internal OSM raw element type
// ──────────────────────────────────────────────────────────────

interface OsmRawElement {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

// ──────────────────────────────────────────────────────────────
// Overpass Query Builder
// ──────────────────────────────────────────────────────────────

const buildQuery = (lat: number, lon: number, radiusMeters: number, preferences: StumblePreference[]): string => {
  const filters = preferences
    .flatMap(pref => STUMBLE_OSM_FILTERS[pref].split('\n').map(l => l.trim()).filter(Boolean))
    .map(filter =>
      filter
        .replace('{lat}', String(lat))
        .replace('{lon}', String(lon))
        .replace('{radius}', String(radiusMeters))
    )
    .join('\n    ')

  return `[out:json][timeout:10];
(
    ${filters}
);
out body ${50};`
}

// ──────────────────────────────────────────────────────────────
// Overpass API Connector
// ──────────────────────────────────────────────────────────────

/** Configurable via OVERPASS_URL env var — defaults to public instance */
const OVERPASS_URL = Deno.env.get('OVERPASS_URL') ?? 'https://overpass-api.de/api/interpreter'

export const osmConnector: PoiConnector = {
  /**
   * Fetches POIs from OpenStreetMap Overpass API based on location and preferences.
   */
  fetchPois: async (
    lat: number,
    lon: number,
    radiusMeters: number,
    preferences: StumblePreference[],
  ): Promise<Poi[]> => {
    const query = buildQuery(lat, lon, radiusMeters, preferences)

    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    })

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`)
    }

    const json = await response.json()
    const elements: OsmRawElement[] = json.elements ?? []

    return elements
      .filter(el => (el.lat ?? el.center?.lat) !== undefined)
      .map(el => {
        const tags = el.tags ?? {}
        return {
          id: String(el.id),
          lat: (el.lat ?? el.center!.lat) as number,
          lon: (el.lon ?? el.center!.lon) as number,
          name: tags.name,
          category: detectStumbleCategory(tags),
        }
      })
  },
}
