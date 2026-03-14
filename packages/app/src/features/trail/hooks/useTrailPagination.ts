import { usePaginatedList } from '@app/shared/hooks/usePaginatedList'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { Trail } from '@shared/contracts'
import { useCallback } from 'react'
import { getTrailStoreActions } from '../stores/trailStore'

export function useTrailPagination() {
  const { api } = getAppContextStore()

  const fetchTrails = useCallback(
    (query: { limit: number; cursor?: string }) => api.trail.listTrails(query),
    [api]
  )

  const handleTrailData = useCallback((items: Trail[], isRefresh: boolean) => {
    const { setTrails, upsertTrails } = getTrailStoreActions()
    if (isRefresh) setTrails(items)
    else upsertTrails(items)
  }, [])

  return usePaginatedList(['trails'], fetchTrails, handleTrailData)
}
