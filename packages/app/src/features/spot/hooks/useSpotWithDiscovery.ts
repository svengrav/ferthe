import { useDiscoveries } from '@app/features/discovery'
import { Discovery, Spot } from '@shared/contracts'
import { useSpotData } from './useSpotData'

interface UseSpotWithDiscoveryResult {
  spot: Spot | undefined
  discovery: Discovery | undefined
  isLoading: boolean
}

/**
 * Custom hook that combines spot data with its associated discovery.
 * Useful for components that need both spot and discovery information.
 * 
 * @param spotId - ID of the spot to fetch
 * @returns Object containing spot, discovery (if exists), and loading state
 */
export const useSpotWithDiscovery = (spotId: string): UseSpotWithDiscoveryResult => {
  const { spot, isLoading } = useSpotData(spotId)
  const discoveries = useDiscoveries()

  // Find the user's discovery for this spot
  const discovery = discoveries.find(d => d.spotId === spotId)

  return {
    spot,
    discovery,
    isLoading,
  }
}
