import { useDiscoveredSpotPagination } from './useDiscoveredSpotPagination'
import { useMySpotsPagination } from './useMySpotsPagination'
import { useSpots } from '../stores/spotStore'

/**
 * ViewModel hook for SpotScreen.
 * "My Spots" loads all (typically few items).
 * "Discoveries" uses paginated loading.
 */
export function useSpotScreen() {
  const spots = useSpots()

  const myPagination = useMySpotsPagination()
  const discoveredPagination = useDiscoveredSpotPagination()

  const toItem = (spot: typeof spots[number]) => ({
    id: spot.id,
    image: spot.image,
    blurredImage: spot.blurredImage,
    title: spot.name,
    isLocked: false,
  })

  const mySpots = spots.filter(s => s.source === 'created').map(toItem)
  const discoveredSpots = spots.filter(s => s.source === 'discovery').map(toItem)

  return {
    mySpots,
    discoveredSpots,
    isLoading: myPagination.isRefreshing || discoveredPagination.isRefreshing,
    myLoadMore: myPagination.loadMore,
    myLoadingMore: myPagination.isLoading,
    loadMore: discoveredPagination.loadMore,
    loadingMore: discoveredPagination.isLoading,
    refresh: () => {
      myPagination.refresh()
      discoveredPagination.refresh()
    },
  }
}
