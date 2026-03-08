import { GeoLocationSchema } from '@shared/geo/types.ts'
import { z } from 'zod'
import { Result } from './results.ts'

export const StumblePreferenceSet = [
  'historical',
  'cafe',
  'art',
  'architecture',
  'nature',
  'street_art',
]

export const StumblePreferenceSchema = z.enum(StumblePreferenceSet)

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
  /** Short description from OSM or provider — extendable in future */
  description: z.string().optional(),
})

/** API response type — extends stored suggestion with request context */
export const StumbleSuggestionResultSchema = StumbleSuggestionSchema.extend({
  category: StumblePreferenceSchema,
})

export type StumblePreference = z.infer<typeof StumblePreferenceSchema>
export type StumbleSuggestion = z.infer<typeof StumbleSuggestionSchema>
export type StumbleSuggestionResult = z.infer<typeof StumbleSuggestionResultSchema>

export type StumbleSuggestionsQuery = {
  [key: string]: string | number | boolean | undefined
  lat: number
  lon: number
  radius: number
  preferences: string
  language?: string
}


export const StumbleVisitSchema = z.object({
  id: z.string(),
  poiId: z.string(),
  accountId: z.string(),
  visitedAt: z.number(),
  /** Optional: Spot created from this POI */
  spotId: z.string().optional(),
})

export type StumbleVisit = z.infer<typeof StumbleVisitSchema>

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

export interface StumbleApplicationContract {
  getSuggestions: (
    lat: number,
    lon: number,
    radiusMeters: number,
    preferences: StumblePreference[],
    language?: string,
  ) => Promise<Result<StumbleSuggestionResult[]>>

  /** Record a POI visit for the user */
  recordVisit: (accountId: string, poiId: string, spotId?: string) => Promise<Result<StumbleVisit>>

  /** Get all visits for a user */
  getVisits: (accountId: string) => Promise<Result<StumbleVisit[]>>
}
