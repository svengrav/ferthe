import { usePaginatedList } from '@app/shared/hooks/usePaginatedList'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { Community } from '@shared/contracts'
import { useCallback } from 'react'
import { getCommunityActions } from '../stores/communityStore'

export function useCommunityPagination() {
  const { api } = getAppContextStore()

  const fetchCommunities = useCallback(
    (query: { limit: number; cursor?: string }) => api.community.listCommunities(query),
    [api]
  )

  const handleCommunityData = useCallback((items: Community[], isRefresh: boolean) => {
    const { setCommunities, upsertCommunities } = getCommunityActions()
    if (isRefresh) setCommunities(items)
    else upsertCommunities(items)
  }, [])

  return usePaginatedList(['communities'], fetchCommunities, handleCommunityData)
}
