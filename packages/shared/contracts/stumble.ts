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
  category: StumblePreferenceSchema,
  hint: z.string().optional(),
})

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export type StumblePreference = z.infer<typeof StumblePreferenceSchema>
export type StumbleSuggestion = z.infer<typeof StumbleSuggestionSchema>

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

/** Human-readable hint per preference */
export const STUMBLE_HINTS: Record<StumblePreference, string> = {
  historical: 'Historical place worth documenting',
  cafe: 'Local café to explore',
  art: 'Artwork or cultural space',
  architecture: 'Notable building or structure',
  nature: 'Natural feature or park',
  street_art: 'Street art or mural',
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
  ) => Promise<Result<StumbleSuggestion[]>>
}
