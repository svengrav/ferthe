import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { Result } from '@shared/contracts'
import { useCallback, useEffect } from 'react'

const DEFAULT_PAGE_SIZE = 20

/**
 * Universal hook for paginated list loading using TanStack useInfiniteQuery.
 * Manages cursor-based pagination and syncs data into an external store (e.g. Zustand).
 *
 * @param queryKey - TanStack Query cache key
 * @param fetchFn  - API call accepting { limit, cursor? }
 * @param onData   - Callback to sync fetched items into a store
 * @param options  - Optional pageSize (default: 20)
 */
export function usePaginatedList<T>(
  queryKey: unknown[],
  fetchFn: (query: { limit: number; cursor?: string }) => Promise<Result<T[]>>,
  onData: (items: T[], isRefresh: boolean) => void,
  options?: { pageSize?: number }
) {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      fetchFn({ limit: pageSize, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
  })

  // Sync all loaded pages into the external store whenever data changes
  useEffect(() => {
    if (!query.data) return
    const allItems = query.data.pages.flatMap(p => p.data ?? [])
    onData(allItems, true)
  }, [query.data]) // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    void queryClient.resetQueries({ queryKey })
  }, [queryClient, ...queryKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isLoading: query.isFetchingNextPage,
    isRefreshing: query.isFetching && !query.isFetchingNextPage,
    hasMore: query.hasNextPage ?? false,
    refresh,
    loadMore: query.fetchNextPage,
  }
}
