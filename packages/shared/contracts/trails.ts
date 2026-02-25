import { GeoBoundary } from '@shared/geo/index.ts'
import { AccountContext } from './accounts.ts'
import { ImageReference } from './images.ts'
import { QueryOptions, Result } from './results.ts'
import { RatingSummary } from './spots.ts'
import { StoredTrailSpot, TrailSpot } from './trailSpots.ts'

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

/**
 * Trail map configuration with optional background image.
 */
export interface TrailMap {
  image?: ImageReference
}

/**
 * Viewport configuration with optional background image.
 * Viewport image is static and does not move with the surface.
 */
export interface TrailViewport {
  image?: ImageReference
}

/**
 * Overview configuration with optional background image.
 * Overview image covers the full trail boundary in overview mode.
 */
export interface TrailOverview {
  image?: ImageReference
}

/**
 * Represents a trail in the application.
 * A trail consists of multiple spots and has associated metadata such as name, description, and options.
 * Image URLs are generated at runtime with fresh SAS tokens.
 */
export interface Trail {
  id: string
  slug: string
  name: string
  description: string
  map: TrailMap
  viewport?: TrailViewport
  overview?: TrailOverview
  image?: ImageReference
  boundary: GeoBoundary
  options: Options
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Internal trail entity as stored in database.
 * Extends Trail with additional blob path fields for image storage.
 */
export interface StoredTrail extends Omit<Trail, 'map' | 'viewport' | 'overview'> {
  imageBlobPath?: string
  map: TrailMap & {
    imageBlobPath?: string
  }
  viewport?: TrailViewport & {
    imageBlobPath?: string
  }
  overview?: TrailOverview & {
    imageBlobPath?: string
  }
}

/**
 * Defines the discovery modes available for trails.
 * - 'free': Allows free exploration of the trail.
 * - 'sequence': Requires following a specific sequence of spots.
 */
export type DiscoveryMode = 'free' | 'sequence'

/**
 * Defines the preview modes available for trails.
 * - 'hidden': No preview is shown.
 * - 'preview': Shows a preview of the trail.
 * - 'discovered': Shows a preview of the discovered trail.
 */
export type PreviewMode = 'hidden' | 'preview' | 'discovered'

/**
 * User rating (1-5 stars) for a trail.
 */
export interface TrailRating {
  id: string
  trailId: string
  accountId: string
  rating: number // 1-5 stars
  createdAt: Date
}

/**
 * Defines the options for a trail.
 */
interface Options {
  scannerRadius: number
  discoveryMode: DiscoveryMode
  previewMode: PreviewMode
  snapRadius?: number
}

/**
 * Statistics for a trail from the user's perspective.
 */
export interface TrailStats {
  trailId: string
  totalSpots: number
  discoveredSpots: number
  discoveriesCount: number
  progressPercentage: number
  completionStatus: 'not_started' | 'in_progress' | 'completed'
  rank: number // User's rank among all trail discoverers (0 if not started)
  totalDiscoverers: number // Total users who discovered at least one spot
  firstDiscoveredAt?: Date
  lastDiscoveredAt?: Date
  averageTimeBetweenDiscoveries?: number // In seconds
}
