import { AccountContext } from './accounts.ts'
import { Result } from './results.ts'

/**
 * Junction table for many-to-many relationship between Trails and Spots.
 * Represents the association of a spot to a trail with optional ordering.
 */
export interface TrailSpot {
  id: string
  trailId: string
  spotId: string
  order?: number // Optional: for sequence-based discovery modes
  createdAt: Date
}

/**
 * Application contract for managing trail-spot relationships.
 */
export interface TrailSpotApplicationContract {
  addSpotToTrail: (context: AccountContext, trailId: string, spotId: string, order?: number) => Promise<Result<TrailSpot>>
  removeSpotFromTrail: (context: AccountContext, trailId: string, spotId: string) => Promise<Result<void>>
  getTrailSpots: (context: AccountContext, trailId: string) => Promise<Result<TrailSpot[]>>
  getSpotTrails: (context: AccountContext, spotId: string) => Promise<Result<TrailSpot[]>>
}
