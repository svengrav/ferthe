import { Discovery } from '@shared/contracts/discoveries'
import { Spot } from '@shared/contracts/spots'
import { DiscoveryCardState } from './types'

const createDiscoveryCards = (discoveries: Discovery[], spots: Spot[]): DiscoveryCardState[] => {
  return discoveries.map(discovery => {
    const spot = spots.find(s => s.id === discovery.spotId)
    return {
      id: discovery.id,
      title: spot?.name || 'Unknown Spot',
      image: {
        url: spot?.image?.url || '',
        blurredUrl: spot?.image?.previewUrl || '',
      },
      description: spot?.description || 'No description available.',
      discoveredAt: discovery.createdAt,
      spotId: discovery.spotId,
    }
  })
}

export const discoveryService = {
  createDiscoveryCards,
}
