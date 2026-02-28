import { z } from 'zod'
import { GeoBoundarySchema } from "../geo/types.ts"
import { AccountContext } from './accounts.ts'
import { ImageReferenceSchema } from './images.ts'
import { QueryOptions, Result } from './results.ts'
import { RatingSummary } from './spots.ts'
import { guard } from './strings.ts'
import { StoredTrailSpot, TrailSpot } from './trailSpots.ts'

// ──────────────────────────────────────────────────────────────
// Zod Schemas (Source of Truth)
// ──────────────────────────────────────────────────────────────

/**
 * Discovery mode enum
 */
export const DiscoveryModeSchema = z.enum(['free', 'sequence'])

/**
 * Preview mode enum
 */
export const PreviewModeSchema = z.enum(['hidden', 'preview', 'discovered'])

/**
 * Trail map configuration with optional background image
 */
export const TrailMapSchema = z.object({
  image: ImageReferenceSchema.optional(),
})

/**
 * Viewport configuration with optional background image
 */
export const TrailViewportSchema = z.object({
  image: ImageReferenceSchema.optional(),
})

/**
 * Overview configuration with optional background image
 */
export const TrailOverviewSchema = z.object({
  image: ImageReferenceSchema.optional(),
})

/**
 * Trail options schema
 */
export const TrailOptionsSchema = z.object({
  scannerRadius: guard.positiveInt,
  discoveryMode: DiscoveryModeSchema,
  previewMode: PreviewModeSchema,
  snapRadius: guard.positiveInt.optional(),
})

/**
 * Trail schema
 */
export const TrailSchema = z.object({
  id: guard.idString,
  slug: guard.slug,
  name: guard.shortText,
  description: guard.mediumText,
  map: TrailMapSchema,
  viewport: TrailViewportSchema.optional(),
  overview: TrailOverviewSchema.optional(),
  image: ImageReferenceSchema.optional(),
  boundary: GeoBoundarySchema, // GeoBoundary - complex type from geo package
  options: TrailOptionsSchema,
  createdBy: guard.idString.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * Stored trail schema (with blob paths)
 */
export const StoredTrailSchema = TrailSchema.omit({ map: true, viewport: true, overview: true }).extend({
  imageBlobPath: guard.idString.optional(),
  map: TrailMapSchema.extend({
    imageBlobPath: guard.idString.optional(),
  }),
  viewport: TrailViewportSchema.extend({
    imageBlobPath: guard.idString.optional(),
  }).optional(),
  overview: TrailOverviewSchema.extend({
    imageBlobPath: guard.idString.optional(),
  }).optional(),
})

/**
 * Trail guard.rating schema
 */
export const TrailRatingSchema = z.object({
  id: guard.idString,
  trailId: guard.idString,
  accountId: guard.idString,
  rating: z.number().int().min(1).max(5),
  createdAt: z.date(),
})

/**
 * Trail stats schema
 */
export const TrailStatsSchema = z.object({
  trailId: guard.idString,
  totalSpots: guard.nonNegativeInt,
  discoveredSpots: guard.nonNegativeInt,
  discoveriesCount: guard.nonNegativeInt,
  progressPercentage: z.number().min(0).max(100),
  completionStatus: z.enum(['not_started', 'in_progress', 'completed']),
  rank: guard.positiveInt,
  totalDiscoverers: guard.positiveInt,
  firstDiscoveredAt: z.date().optional(),
  lastDiscoveredAt: z.date().optional(),
  averageTimeBetweenDiscoveries: guard.nonNegativeInt.optional(),
})

// ──────────────────────────────────────────────────────────────
// TypeScript Types (Inferred from Zod Schemas)
// ──────────────────────────────────────────────────────────────

/**
 * Request schema for creating a new trail
 */
export const CreateTrailRequestSchema = TrailSchema.omit({
  id: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
}).extend({
  imageBase64: guard.base64String.optional(),
  mapImageBase64: guard.base64String.optional(),
  canvasImageBase64: guard.base64String.optional(),
})

/**
 * Request schema for updating an existing trail
 */
export const UpdateTrailRequestSchema = TrailSchema.pick({
  name: true,
  description: true,
  boundary: true,
  options: true,
  map: true,
  viewport: true,
  overview: true,
  image: true,
}).extend({
  imageBase64: guard.base64String.optional(),
  mapImageBase64: guard.base64String.optional(),
  canvasImageBase64: guard.base64String.optional(),
}).partial()

export type DiscoveryMode = z.infer<typeof DiscoveryModeSchema>
export type PreviewMode = z.infer<typeof PreviewModeSchema>
export type TrailMap = z.infer<typeof TrailMapSchema>
export type TrailViewport = z.infer<typeof TrailViewportSchema>
export type TrailOverview = z.infer<typeof TrailOverviewSchema>
export type Trail = z.infer<typeof TrailSchema>
export type StoredTrail = z.infer<typeof StoredTrailSchema>
export type TrailRating = z.infer<typeof TrailRatingSchema>
export type TrailStats = z.infer<typeof TrailStatsSchema>
export type CreateTrailRequest = z.infer<typeof CreateTrailRequestSchema>
export type UpdateTrailRequest = z.infer<typeof UpdateTrailRequestSchema>

// ──────────────────────────────────────────────────────────────
// Application Contract (unchanged)
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// Application Contract (unchanged)
// ──────────────────────────────────────────────────────────────

/**
 * Application contract for managing trails and their associated spots.
 * Provides methods to list, create, and retrieve trails and spots.
 */
export interface TrailApplicationContract {
  listTrails: (context: AccountContext, options?: QueryOptions) => Promise<Result<Trail[]>>
  getTrail: (context: AccountContext, trailId: string) => Promise<Result<Trail | undefined>>
  getTrailSpotIds: (context: AccountContext, trailId: string) => Promise<Result<string[]>>
  getTrailSpots: (context: AccountContext, trailId: string) => Promise<Result<TrailSpot[]>>
  createTrail: (context: AccountContext, trailData: Omit<Trail, 'id'>) => Promise<Result<Trail>>
  updateTrail: (context: AccountContext, trailId: string, trailData: Partial<Pick<Trail, 'name' | 'description' | 'boundary'>>) => Promise<Result<Trail>>
  deleteTrail: (context: AccountContext, trailId: string) => Promise<Result<void>>
  addSpotToTrail: (context: AccountContext, trailId: string, spotId: string, order?: number) => Promise<Result<StoredTrailSpot>>
  removeSpotFromTrail: (context: AccountContext, trailId: string, spotId: string) => Promise<Result<void>>
  rateTrail: (context: AccountContext, trailId: string, rating: number) => Promise<Result<TrailRating>>
  removeTrailRating: (context: AccountContext, trailId: string) => Promise<Result<void>>
  getTrailRatingSummary: (context: AccountContext, trailId: string) => Promise<Result<RatingSummary>>
}
