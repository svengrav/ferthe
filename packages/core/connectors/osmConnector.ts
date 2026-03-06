import { StumblePreference, detectStumbleCategory } from '@shared/contracts/stumble.ts'
import { Poi, PoiConnector } from './poiConnector.ts'


/** Overpass QL filter fragments per preference (placeholders: {lat} {lon} {radius}) */
export const STUMBLE_OSM_FILTERS: Record<StumblePreference, string> = {
  historical: `node["historic"](around:{radius},{lat},{lon});
    way["historic"](around:{radius},{lat},{lon});`,
  cafe: `node["amenity"="cafe"](around:{radius},{lat},{lon});`,
  art: `node["tourism"="artwork"](around:{radius},{lat},{lon});
    node["amenity"="arts_centre"](around:{radius},{lat},{lon});`,
  architecture: `way["building"]["name"](around:{radius},{lat},{lon});`,
  nature: `node["natural"](around:{radius},{lat},{lon});
    way["leisure"="park"](around:{radius},{lat},{lon});`,
  street_art: `node["tourism"="artwork"]["artwork_type"="mural"](around:{radius},{lat},{lon});`,
}
interface OsmRawElement {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

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
