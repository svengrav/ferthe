import { Discovery, Spot } from '@shared/contracts'
import { GeoLocation } from '@shared/geo'
import { DiscoveryEventState } from './types'

const getLastDiscoverySpotLocation = (discovery: Discovery | undefined, spots: Spot[]): GeoLocation | undefined => {
  if (!discovery) return undefined
  return spots.find(spot => spot.id === discovery.spotId)?.location
}

const createDiscoveryCards = (discoveries: Discovery[], spots: Spot[]): DiscoveryEventState[] => {
  return discoveries.map(discovery => {
    const spot = spots.find(s => s.id === discovery.spotId)
    return {
      discoveryId: discovery.id,
      title: spot?.name || 'Unknown Spot',
      image: spot?.image || { id: '', url: '' },
      blurredImage: spot?.blurredImage,
      description: spot?.description || 'No description available.',
      discoveredAt: discovery.discoveredAt, // Use actual discovery date
      spotId: discovery.spotId,
    }
  })
}

export const discoveryService = {
  createDiscoveryCards,
  getLastDiscoverySpotLocation,
}
