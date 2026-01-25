export interface DiscoveryCardState {
  discoveryId?: string
  title: string
  spotId: string
  discoveredAt: Date
  discoveredBy?: string // accountId of the discoverer (for community discoveries)
  image: {
    url: string
    blurredUrl: string
  }
  description: string
}
