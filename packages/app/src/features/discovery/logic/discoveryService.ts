import { Discovery, DiscoverySpot } from '@shared/contracts/discoveries'
import { GeoLocation } from '@shared/geo'
import { DiscoveryCardState } from './types'

const getLastDiscoverySpotLocation = (discovery: Discovery | undefined, discoverySpots: DiscoverySpot[]): GeoLocation | undefined => {
  if (!discovery) return undefined
  return discoverySpots.find(ds => ds.id === discovery.spotId)?.location
}

const createDiscoveryCards = (discoveries: Discovery[], discoverySpots: DiscoverySpot[]): DiscoveryCardState[] => {
  return discoveries.map(discovery => {
    const spot = discoverySpots.find(ds => ds.id === discovery.spotId)
    return {
      discoveryId: discovery.id,
      title: spot?.name || 'Unknown Spot',
      image: spot?.image || { id: '', url: '', previewUrl: '' },
      description: spot?.description || 'No description available.',
      discoveredAt: discovery.createdAt,
      spotId: discovery.spotId,
    }
  })
}

export const discoveryService = {
  createDiscoveryCards,
  getLastDiscoverySpotLocation,
}
