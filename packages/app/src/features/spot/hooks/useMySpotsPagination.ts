import { usePaginatedList } from '@app/shared/hooks/usePaginatedList'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { Spot } from '@shared/contracts'
import { useCallback } from 'react'
import { getSpotStoreActions, getSpots } from '../stores/spotStore'

export function useMySpotsPagination() {
  const { api } = getAppContextStore()

  const fetchMySpots = useCallback(
    (query: { limit: number; cursor?: string }) => api.spot.listSpots(query),
    [api]
  )

  const handleMySpotData = useCallback((items: Spot[], isRefresh: boolean) => {
    const { setSpots, upsertSpot } = getSpotStoreActions()
    if (isRefresh) {
      // On refresh, clear stale created spots but keep everything else
      const spotsToKeep = getSpots().filter(s => s.source !== 'created')
      setSpots(spotsToKeep)
    }
    // Explicitly tag as 'created' since the API doesn't always set source
    items.forEach(spot => upsertSpot({ ...spot, source: 'created' } as any))
  }, [])

  return usePaginatedList(['my-spots'], fetchMySpots, handleMySpotData)
}
