import { GeoLocation } from '@shared/geo/index.ts'
import { AccountContext } from './accounts.ts'
import { ImageReference } from './images.ts'
import { Result } from './results.ts'

export interface SpotApplicationContract {
  getSpotPreviews: () => Promise<Result<SpotPreview[]>>
  getSpots: (context?: AccountContext) => Promise<Result<Spot[]>>
  getSpot: (context: AccountContext, id: string) => Promise<Result<Spot | undefined>>
  createSpot: (spotData: Omit<Spot, 'id'>) => Promise<Result<Spot>>
}

export type SpotVisibility = 'hidden' | 'preview'

/**
 * User-specific status of a spot from the perspective of the current user.
 * - 'discovered': User has discovered this spot
 * - 'preview': User has seen clues/preview but not discovered yet
 * - 'creator': User created this spot
 * - 'unknown': User has no interaction with this spot
 */
export type SpotUserStatus = 'discovered' | 'preview' | 'creator' | 'unknown'

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
  options: {
    discoveryRadius: number
    clueRadius: number
    visibility?: SpotVisibility
  }
  createdAt: Date
  updatedAt: Date
  createdBy?: string // Account ID of creator
  userStatus?: SpotUserStatus // User-specific status (only present when fetched with user context)
}

/**
 * Internal spot entity as stored in database.
 * Extends Spot with additional blob path fields for image storage.
 */
export interface StoredSpot extends Spot {
  imageBlobPath?: string
  blurredImageBlobPath?: string
}

export interface SpotPreview {
  id: string
  blurredImage?: ImageReference
}
