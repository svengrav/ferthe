import { Spot, SpotPreview } from '@shared/contracts/index.ts'
import { GeoBoundary } from '@shared/geo/index.ts'
import { AccountContext } from './accounts.ts'
import { ImageReference } from './images.ts'
import { Result } from './results.ts'
import { TrailSpot } from './trailSpots.ts'

/**
 * Application contract for managing trails and their associated spots.
 * Provides methods to list, create, and retrieve trails and spots.
 */
export interface TrailApplicationContract {
  listTrails: (context: AccountContext) => Promise<Result<Trail[]>>
  listSpots: (context: AccountContext, trailId?: string) => Promise<Result<Spot[]>>
  listSpotPreviews: (context: AccountContext, trailId?: string) => Promise<Result<SpotPreview[]>>
  getSpot: (context: AccountContext, spotId: string) => Promise<Result<Spot | undefined>>
  getTrail: (context: AccountContext, trailId: string) => Promise<Result<Trail | undefined>>
  getTrailSpotIds: (context: AccountContext, trailId: string) => Promise<Result<string[]>>
  getTrailStats: (context: AccountContext, trailId: string) => Promise<Result<TrailStats>>
  createTrail: (context: AccountContext, trailData: Omit<Trail, 'id'>) => Promise<Result<Trail>>
  createSpot: (context: AccountContext, spotData: Omit<Spot, 'id'>) => Promise<Result<Spot>>
  addSpotToTrail: (context: AccountContext, trailId: string, spotId: string, order?: number) => Promise<Result<TrailSpot>>
  removeSpotFromTrail: (context: AccountContext, trailId: string, spotId: string) => Promise<Result<void>>
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
