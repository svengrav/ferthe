import { GeoLocation } from '@shared/geo/index.ts'
import { Result } from './results.ts'

export interface SpotApplicationContract {
  getSpotPreviews: () => Promise<Result<SpotPreview[]>>
  getSpots: () => Promise<Result<Spot[]>>
  getSpot: (id: string) => Promise<Result<Spot | undefined>>
  createSpot: (spotData: Omit<Spot, 'id'>) => Promise<Result<Spot>>
}

export type SpotVisibility = 'hidden' | 'preview'

export interface Spot {
  id: string
  slug: string
  name: string
  description: string
  image?: {
    id: string
    url: string
    previewUrl?: string
  }
  location: GeoLocation
  options: {
    discoveryRadius: number
    clueRadius: number
    visibility?: SpotVisibility
  }
  createdAt: Date
  updatedAt: Date
}

export interface SpotPreview {
  id: string
  image?: {
    id: string
    previewUrl?: string
  }
}
