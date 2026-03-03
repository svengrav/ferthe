import { StumblePreference, STUMBLE_OSM_FILTERS } from '@shared/contracts/stumble.ts'

// ──────────────────────────────────────────────────────────────
// OSM Tag Mapping
// ──────────────────────────────────────────────────────────────

export interface OsmPoi {
  id: string
  lat: number
  lon: number
  name?: string
  tags: Record<string, string>
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

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

export const osmConnector = {
  /**
   * Fetches POIs from OpenStreetMap Overpass API based on location and preferences.
   */
  fetchPois: async (
    lat: number,
    lon: number,
    radiusMeters: number,
    preferences: StumblePreference[],
  ): Promise<OsmPoi[]> => {
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
    const elements: { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[] = json.elements ?? []

    return elements
      .filter(el => {
        const lat = el.lat ?? el.center?.lat
        const lon = el.lon ?? el.center?.lon
        return lat !== undefined && lon !== undefined
      })
      .map(el => {
        const lat = (el.lat ?? el.center?.lat) as number
        const lon = (el.lon ?? el.center?.lon) as number
        return {
          id: String(el.id),
          lat,
          lon,
          name: el.tags?.name,
          tags: el.tags ?? {},
        }
      })
  },
}
