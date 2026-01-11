export interface DiscoveryCardState {
  title: string
  discoveryId?: string
  spotId?: string
  discoveredAt: Date
  image: {
    url: string
    blurredUrl: string
  }
  description: string
}
