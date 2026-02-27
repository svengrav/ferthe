import { GeoLocationSchema } from '@shared/geo/types.ts'
import { z } from 'zod'
import { AccountContext } from './accounts.ts'
import { ContentBlockSchema } from './contentBlocks.ts'
import { ImageReferenceSchema } from './images.ts'
import { QueryOptions, Result } from './results.ts'

// ──────────────────────────────────────────────────────────────
// Zod Schemas (Source of Truth)
// ──────────────────────────────────────────────────────────────

/**
 * Spot visibility modes
 */
export const SpotVisibilitySchema = z.enum(['hidden', 'preview', 'private', 'public'])

/**
 * Spot source/origin
 */
export const SpotSourceSchema = z.enum(['discovery', 'preview', 'created', 'public'])

/**
 * Separable content block for a spot
 */
export const SpotContentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  imageBase64: z.string().optional(), // Base64-encoded image data for upload
  contentBlocks: z.array(ContentBlockSchema).optional(),
})

/**
 * Request payload for creating a new spot
 */
export const CreateSpotRequestSchema = z.object({
  content: SpotContentSchema,
  location: GeoLocationSchema,
  visibility: SpotVisibilitySchema,
  trailIds: z.array(z.string()).optional(),
  consent: z.literal(true), // Must be explicitly true
})

/**
 * Request payload for updating an existing spot
 */
export const UpdateSpotRequestSchema = z.object({
  content: SpotContentSchema.partial().optional(),
  visibility: SpotVisibilitySchema.optional(),
  trailIds: z.array(z.string()).optional(),
})

/**
 * Aggregated rating summary for a spot
 */
export const RatingSummarySchema = z.object({
  average: z.number().min(0).max(5), // Average rating (0-5, 0 if no ratings)
  count: z.number().int().min(0), // Total number of ratings
  userRating: z.number().int().min(1).max(5).optional(), // Current user's rating (1-5), if any
})

/**
 * User rating (1-5 stars) for a spot
 */
export const SpotRatingSchema = z.object({
  id: z.string(),
  spotId: z.string(),
  accountId: z.string(),
  rating: z.number().int().min(1).max(5), // 1-5 stars
  createdAt: z.date(),
})

// ──────────────────────────────────────────────────────────────
// TypeScript Types (Inferred from Zod Schemas)
// ──────────────────────────────────────────────────────────────

export type SpotVisibility = z.infer<typeof SpotVisibilitySchema>
export type SpotSource = z.infer<typeof SpotSourceSchema>
export type SpotContent = z.infer<typeof SpotContentSchema>
export type CreateSpotRequest = z.infer<typeof CreateSpotRequestSchema>
export type UpdateSpotRequest = z.infer<typeof UpdateSpotRequestSchema>
export type RatingSummary = z.infer<typeof RatingSummarySchema>
export type SpotRating = z.infer<typeof SpotRatingSchema>

/**
 * Public spot schema
 */
export const SpotSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  image: ImageReferenceSchema.optional(),
  blurredImage: ImageReferenceSchema.optional(), // Blurred version for undiscovered spots
  microImage: ImageReferenceSchema.optional(), // Micro thumbnail (~40px)
  location: GeoLocationSchema,
  contentBlocks: z.array(ContentBlockSchema).optional(),
  options: z.object({
    discoveryRadius: z.number(),
    clueRadius: z.number(),
    visibility: SpotVisibilitySchema.optional(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().optional(), // Account ID of creator
  source: SpotSourceSchema.optional(), // Source/origin of spot
})

/**
 * Internal spot entity as stored in database
 */
export const StoredSpotSchema = SpotSchema.extend({
  imageBlobPath: z.string().optional(),
  blurredImageBlobPath: z.string().optional(),
})

/**
 * Reduced spot representation for list views and previews
 */
export const SpotPreviewSchema = z.object({
  id: z.string(),
  blurredImage: ImageReferenceSchema.optional(),
  rating: RatingSummarySchema, // Community rating (always included)
})

export type Spot = z.infer<typeof SpotSchema>
export type StoredSpot = z.infer<typeof StoredSpotSchema>
export type SpotPreview = z.infer<typeof SpotPreviewSchema>

// ──────────────────────────────────────────────────────────────
// Application Contract (unchanged - uses inferred types)
// ──────────────────────────────────────────────────────────────


export interface SpotApplicationContract {
  getSpotPreviews: (options?: QueryOptions) => Promise<Result<SpotPreview[]>>
  getSpotPreviewsByIds: (context: AccountContext, spotIds: string[], options?: QueryOptions) => Promise<Result<SpotPreview[]>>
  getSpots: (context?: AccountContext, options?: QueryOptions) => Promise<Result<Spot[]>>
  getSpot: (context: AccountContext, id: string, options?: QueryOptions) => Promise<Result<Spot | undefined>>
  getSpotsByIds: (context: AccountContext, spotIds: string[], options?: QueryOptions) => Promise<Result<Spot[]>>
  createSpot: (context: AccountContext, spotData: CreateSpotRequest | Omit<Spot, 'id' | 'slug'>) => Promise<Result<Spot>>
  updateSpot: (context: AccountContext, spotId: string, updates: UpdateSpotRequest) => Promise<Result<Spot>>
  deleteSpot: (context: AccountContext, spotId: string) => Promise<Result<void>>
  rateSpot: (context: AccountContext, spotId: string, rating: number) => Promise<Result<SpotRating>>
  removeSpotRating: (context: AccountContext, spotId: string) => Promise<Result<void>>
  getSpotRatingSummary: (context: AccountContext, spotId: string) => Promise<Result<RatingSummary>>
}
