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

export type StumblePreference = z.infer<typeof StumblePreferenceSchema>

// ── DB entity: stored in stumble_pois table ──

export const StumblePoiSchema = z.object({
  id: z.string(),
  /** Source-prefixed external ID for deduplication (e.g. "osm:12345") */
  externalId: z.string(),
  name: z.string(),
  location: GeoLocationSchema,
  /** Dominant category — the single most relevant preference */
  poiType: StumblePreferenceSchema,
  /** All applicable category tags */
  tags: z.array(z.string()).optional(),
  /** Data source identifier (e.g. "osm", "azure") */
  source: z.string().default('osm'),
  address: z.string().optional(),
  description: z.string().optional(),
  /** Aggregated feedback score (upvotes - downvotes) */
  feedbackScore: z.number().default(0),
  metadata: z.record(z.string(), z.any()).optional(),
})

export type StumblePoi = z.infer<typeof StumblePoiSchema>

// ── API response type ──

export const StumbleSuggestionResultSchema = z.object({
  id: z.string(),
  location: GeoLocationSchema,
  name: z.string(),
  category: StumblePreferenceSchema,
  tags: z.array(z.string()).optional(),
  osmId: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  feedbackScore: z.number().optional(),
  distance: z.number().optional(),
})

export type StumbleSuggestionResult = z.infer<typeof StumbleSuggestionResultSchema>

export type StumbleSuggestionsQuery = {
  [key: string]: string | number | boolean | undefined
  lat: number
  lon: number
  radius: number
  preferences: string
  language?: string
}

// ── Visits ──

export const StumbleVisitSchema = z.object({
  id: z.string(),
  poiId: z.string(),
  accountId: z.string(),
  visitedAt: z.number(),
  /** Optional: Spot created from this POI */
  spotId: z.string().optional(),
})

export type StumbleVisit = z.infer<typeof StumbleVisitSchema>

// ── Feedback ──

export const StumbleFeedbackVoteSchema = z.enum(['up', 'down'])

export const StumbleFeedbackSchema = z.object({
  id: z.string(),
  poiId: z.string(),
  accountId: z.string(),
  vote: StumbleFeedbackVoteSchema,
  createdAt: z.number(),
})

export type StumbleFeedback = z.infer<typeof StumbleFeedbackSchema>
export type StumbleFeedbackVote = z.infer<typeof StumbleFeedbackVoteSchema>

// ── Helpers ──

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

// ── Application contract ──

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

  /** Submit feedback (up/down) for a POI */
  submitFeedback: (accountId: string, poiId: string, vote: StumbleFeedbackVote) => Promise<Result<StumbleFeedback>>

  /** Get user's feedback for visited POIs */
  getFeedback: (accountId: string) => Promise<Result<StumbleFeedback[]>>
}
