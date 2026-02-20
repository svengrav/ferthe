import { GeoLocation } from '@shared/geo/index.ts'
import { AccountContext } from './accounts.ts'
import { ContentBlock } from './contentBlocks.ts'
import { ImageReference } from './images.ts'
import { QueryOptions, Result } from './results.ts'

/**
 * Separable content block for a spot.
 * Designed for future extensibility (e.g. rich media, tags, links).
 */
export interface SpotContent {
  name: string
  description: string
  imageBase64?: string // Base64-encoded image data for upload
}

/**
 * Request payload for creating a new spot.
 */
export interface CreateSpotRequest {
  content: SpotContent
  location: GeoLocation
  visibility: SpotVisibility
  trailIds?: string[]
  consent: true // Must be explicitly true
}

/**
 * Request payload for updating an existing spot.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateSpotRequest {
  content?: Partial<SpotContent>
  visibility?: SpotVisibility
  trailIds?: string[] // Replaces all trail assignments
}

/**
 * Aggregated rating summary for a spot.
 */
export interface RatingSummary {
  average: number // Average rating (0-5, 0 if no ratings)
  count: number // Total number of ratings
  userRating?: number // Current user's rating (1-5), if any
}

/**
 * User rating (1-5 stars) for a spot.
 */
export interface SpotRating {
  id: string
  spotId: string
  accountId: string
  rating: number // 1-5 stars
  createdAt: Date
}

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

export type SpotVisibility = 'hidden' | 'preview'

/**
 * Source/origin indicating why this spot is visible and how it was loaded.
 * Determines data access level and UI presentation.
 * - 'discovery': User has discovered this spot (full access)
 * - 'preview': Spot visible as trail preview/clue (blurred, limited data)
 * - 'created': User created this spot (full access)
 */
export type SpotSource = 'discovery' | 'preview' | 'created'

/**
 * Public spot interface with runtime-generated image URLs.
 */
export interface Spot {
  id: string
  slug: string
  name: string
  description: string
  image?: ImageReference
  blurredImage?: ImageReference // Blurred version for undiscovered spots
  location: GeoLocation
  contentBlocks?: ContentBlock[]
  options: {
    discoveryRadius: number
    clueRadius: number
    visibility?: SpotVisibility
  }
  createdAt: Date
  updatedAt: Date
  createdBy?: string // Account ID of creator
  source?: SpotSource // Source/origin of spot (set by backend based on context)
}

/**
 * Internal spot entity as stored in database.
 * Extends Spot with additional blob path fields for image storage.
 */
export interface StoredSpot extends Spot {
  imageBlobPath?: string
  blurredImageBlobPath?: string
}

/**
 * Reduced spot representation for list views and previews.
 * Contains minimal data to display spots before discovery.
 */
export interface SpotPreview {
  id: string
  blurredImage?: ImageReference
  rating: RatingSummary // Community rating (always included, batch-loaded)
}
