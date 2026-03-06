import { GeoLocationSchema } from '@shared/geo/types.ts'
import { z } from 'zod'
import { Result } from './results.ts'

// ──────────────────────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────────────────────

export const StumblePreferenceSchema = z.enum([
  'historical',
  'cafe',
  'art',
  'architecture',
  'nature',
  'street_art',
])

export const StumbleSuggestionSchema = z.object({
  id: z.string(),
  location: GeoLocationSchema,
  name: z.string(),
  /** Raw OSM/provider tags for multi-categorization or future filtering */
  tags: z.array(z.string()).optional(),
  /** Provider-specific ID for deduplication and deep-linking */
  osmId: z.string().optional(),
  /** Human-readable address or locality */
  address: z.string().optional(),
})

/** API response type — extends stored suggestion with request context */
export const StumbleSuggestionResultSchema = StumbleSuggestionSchema.extend({
  matchedPreference: StumblePreferenceSchema,
})

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export type StumblePreference = z.infer<typeof StumblePreferenceSchema>
export type StumbleSuggestion = z.infer<typeof StumbleSuggestionSchema>
export type StumbleSuggestionResult = z.infer<typeof StumbleSuggestionResultSchema>

// ──────────────────────────────────────────────────────────────
// Domain constants — single source of truth for OSM mappings
// ──────────────────────────────────────────────────────────────

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

/** Detect preference from OSM tags — ordered by specificity */
export const detectStumbleCategory = (tags: Record<string, string>): StumblePreference => {
  if (tags['historic']) return 'historical'
  if (tags['amenity'] === 'cafe') return 'cafe'
  if (tags['tourism'] === 'artwork' && tags['artwork_type'] === 'mural') return 'street_art'
  if (tags['tourism'] === 'artwork' || tags['amenity'] === 'arts_centre') return 'art'
  if (tags['natural'] || tags['leisure'] === 'park') return 'nature'
  if (tags['building']) return 'architecture'
  return 'historical'
}

// ──────────────────────────────────────────────────────────────
// Application Contract
// ──────────────────────────────────────────────────────────────

export interface StumbleApplicationContract {
  getSuggestions: (
    lat: number,
    lon: number,
    radiusMeters: number,
    preferences: StumblePreference[],
  ) => Promise<Result<StumbleSuggestionResult[]>>
}
