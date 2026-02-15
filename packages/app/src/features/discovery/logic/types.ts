import { ImageReference } from '@shared/contracts'

export interface DiscoveryCardState {
  discoveryId: string
  title: string
  spotId: string
  discoveredAt: Date
  discoveredBy?: string // accountId of the discoverer (for community discoveries)
  image: ImageReference
  blurredImage?: ImageReference // For reveal animation
  description: string
}
