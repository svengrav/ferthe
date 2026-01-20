import { Spot, SpotPreview } from '@shared/contracts/index.ts'
import { GeoLocation } from '@shared/geo/index.ts'
import { AccountContext } from './accounts.ts'
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
  createTrail: (context: AccountContext, trailData: Omit<Trail, 'id'>) => Promise<Result<Trail>>
  createSpot: (context: AccountContext, spotData: Omit<Spot, 'id'>) => Promise<Result<Spot>>
  addSpotToTrail: (context: AccountContext, trailId: string, spotId: string, order?: number) => Promise<Result<TrailSpot>>
  removeSpotFromTrail: (context: AccountContext, trailId: string, spotId: string) => Promise<Result<void>>
}

/**
 * Represents a trail in the application.
 * A trail consists of multiple spots and has associated metadata such as name, description, and options.
 */
export interface Trail {
  id: string
  slug: string
  name: string
  description: string
  map: {
    image?: string
  }
  image?: {
    id: string
    url: string
  }
  region?: Region
  options: Options
  createdAt: Date
  updatedAt: Date
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
 * Represents a geographical location with latitude and longitude.
 */
interface Region {
  center: GeoLocation
  radius: number
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
