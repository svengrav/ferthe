import { usePaginatedList } from '@app/shared/hooks/usePaginatedList'
import { getAppContextStore } from '@app/shared/stores/appContextStore'

export function useDiscoveredSpotPagination() {
  const { fetchDiscoveredSpots, handleDiscoveredSpots } = getAppContextStore().spotApplication
  return usePaginatedList(['discovered-spots'], fetchDiscoveredSpots, handleDiscoveredSpots)
}
