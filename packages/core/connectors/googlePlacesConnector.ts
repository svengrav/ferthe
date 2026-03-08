import { StumblePreference } from '@shared/contracts/stumble.ts'
import { Poi, PoiConnector } from './poiConnector.ts'

// ──────────────────────────────────────────────────────────────
// Google Places API (New) — Nearby Search
// Docs: https://developers.google.com/maps/documentation/places/web-service/nearby-search
// ──────────────────────────────────────────────────────────────

const BASE_URL = 'https://places.googleapis.com/v1/places:searchNearby'
const MAX_RESULTS = 20
const FIELD_MASK = 'places.id,places.displayName,places.location,places.types,places.editorialSummary,places.formattedAddress'

// ──────────────────────────────────────────────────────────────
// Category mapping
// ──────────────────────────────────────────────────────────────

const PLACE_TYPES: Record<StumblePreference, string[]> = {
  historical: ['monument', 'historical_place', 'cultural_landmark', 'tourist_attraction'],
  cafe: ['cafe', 'coffee_shop'],
  art: ['art_gallery', 'museum'],
  architecture: ['cultural_landmark'],
  nature: ['park', 'national_park', 'nature_reserve'],
  street_art: ['art_gallery'],
}

/** Map a set of Google place types back to a StumblePreference */
const detectCategory = (
  types: string[],
  preference: StumblePreference,
): StumblePreference => {
  const set = new Set(types)
  // Respect the preference the request was made for where possible
  const expected = PLACE_TYPES[preference]
  if (expected.some(t => set.has(t))) return preference

  // Fallback: first matching preference
  for (const [pref, ptypes] of Object.entries(PLACE_TYPES) as [StumblePreference, string[]][]) {
    if (ptypes.some(t => set.has(t))) return pref
  }
  return preference
}

// ──────────────────────────────────────────────────────────────
// Google Places API response types (internal)
// ──────────────────────────────────────────────────────────────

interface GooglePlace {
  id: string
  displayName?: { text: string }
  location: { latitude: number; longitude: number }
  types?: string[]
  editorialSummary?: { text: string }
  formattedAddress?: string
}

interface GoogleNearbySearchResponse {
  places?: GooglePlace[]
}

// ──────────────────────────────────────────────────────────────
// Connector
// ──────────────────────────────────────────────────────────────

export function createGooglePlacesConnector(apiKey: string): PoiConnector {
  const fetchForPreference = async (
    lat: number,
    lon: number,
    radiusMeters: number,
    preference: StumblePreference,
    language = 'en',
  ): Promise<Poi[]> => {
    try {

      const body = {
        includedTypes: PLACE_TYPES[preference],
        maxResultCount: MAX_RESULTS,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lon },
            radius: radiusMeters,
          },
        },
        languageCode: language,
      }

      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`)
      }

      const json: GoogleNearbySearchResponse = await response.json()

      return (json.places ?? []).map(place => ({
        id: place.id,
        lat: place.location.latitude,
        lon: place.location.longitude,
        name: place.displayName?.text,
        category: detectCategory(place.types ?? [], preference),
        description: place.editorialSummary?.text,
        address: place.formattedAddress,
      }))

    } catch (e) {
      console.log("error", e)
      return []
    }
  }

  return {
    fetchPois: async (
      lat: number,
      lon: number,
      radiusMeters: number,
      preferences: StumblePreference[],
      language?: string,
    ): Promise<Poi[]> => {
      if (preferences.length === 0) return []

      // Fire one request per preference in parallel
      const results = await Promise.all(
        preferences.map(pref => fetchForPreference(lat, lon, radiusMeters, pref, language)),
      )

      // Deduplicate by place ID across preference buckets
      const seen = new Set<string>()
      const pois: Poi[] = []
      for (const bucket of results) {
        for (const poi of bucket) {
          if (!seen.has(poi.id)) {
            seen.add(poi.id)
            pois.push(poi)
          }
        }
      }

      return pois
    },
  }
}
