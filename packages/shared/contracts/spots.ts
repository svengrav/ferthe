import { GeoLocation } from '@shared/geo/index.ts'
import { ImageReference } from './images.ts'
import { Result } from './results.ts'

export interface SpotApplicationContract {
  getSpotPreviews: () => Promise<Result<SpotPreview[]>>
  getSpots: () => Promise<Result<Spot[]>>
  getSpot: (id: string) => Promise<Result<Spot | undefined>>
  createSpot: (spotData: Omit<Spot, 'id'>) => Promise<Result<Spot>>
}

export type SpotVisibility = 'hidden' | 'preview'

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
