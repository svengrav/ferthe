import { z } from 'zod'
import { AccountContext } from './accounts.ts'
import { ImageReferenceSchema } from './images.ts'
import { Result } from './results.ts'
import { RatingSummarySchema } from './spots.ts'

/**
 * Internal junction table entity for many-to-many relationship between Trails and Spots.
 * Represents the database record of a spot-trail association.
 */
export const StoredTrailSpotSchema = z.object({
  id: z.string(),
  trailId: z.string(),
  spotId: z.string(),
  order: z.number().optional(),
  createdAt: z.date(),
})

export type StoredTrailSpot = z.infer<typeof StoredTrailSpotSchema>

/**
 * Public TrailSpot response DTO.
 * Represents a spot in trail context with safe preview data.
 * Does NOT include full spot data (location, description) for undiscovered spots.
 */
export const TrailSpotSchema = z.object({
  spotId: z.string(),
  order: z.number(),
  preview: z.object({
    blurredImage: ImageReferenceSchema.optional(),
    rating: RatingSummarySchema,
  }).optional(),
})

export type TrailSpot = z.infer<typeof TrailSpotSchema>

/**
 * Application contract for managing trail-spot relationships.
 * Internal operations work with StoredTrailSpot entities.
 */
export interface TrailSpotApplicationContract {
  addSpotToTrail: (context: AccountContext, trailId: string, spotId: string, order?: number) => Promise<Result<StoredTrailSpot>>
  removeSpotFromTrail: (context: AccountContext, trailId: string, spotId: string) => Promise<Result<void>>
  getTrailSpots: (context: AccountContext, trailId: string) => Promise<Result<StoredTrailSpot[]>>
  getSpotTrails: (context: AccountContext, spotId: string) => Promise<Result<StoredTrailSpot[]>>
}
