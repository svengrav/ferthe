import { AccountContext } from './accounts.ts'
import { ImageReference } from './images.ts'
import { Result } from './results.ts'
import { RatingSummary } from './spots.ts'

/**
 * Internal junction table entity for many-to-many relationship between Trails and Spots.
 * Represents the database record of a spot-trail association.
 */
export interface StoredTrailSpot {
  id: string
  trailId: string
  spotId: string
  order?: number // Optional: for sequence-based discovery modes
  createdAt: Date
}

/**
 * Public TrailSpot response DTO.
 * Represents a spot in trail context with safe preview data.
 * Does NOT include full spot data (location, description) for undiscovered spots.
 */
export interface TrailSpot {
  spotId: string
  order: number
  preview?: {
    blurredImage?: ImageReference
    rating: RatingSummary
  }
}

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
