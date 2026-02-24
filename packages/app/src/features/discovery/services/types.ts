import { ImageReference } from '@shared/contracts'

export interface DiscoveryEventState {
  discoveryId: string
  title: string
  spotId: string
  discoveredAt?: Date // Optional: undefined for undiscovered spots
  discoveredBy?: string // accountId of the discoverer (for community discoveries)
  image: ImageReference
  blurredImage?: ImageReference // For reveal animation
  description: string
}
