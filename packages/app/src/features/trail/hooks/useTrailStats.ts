import { logger } from '@app/shared/utils/logger'
import { TrailStats } from '@shared/contracts'
import { useEffect, useState } from 'react'
import { getTrailStoreActions, trailStore } from '../stores/trailStore'
import { getAppContextStore } from '@app/shared/stores/appContextStore'

interface UseTrailStatsResult {
  stats: TrailStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and cache TrailStats for a given trail.
 * Stats are cached in the trailStore to avoid redundant API calls.
 */
export const useTrailStats = (trailId: string): UseTrailStatsResult => {
  const { trailApplication } = getAppContextStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stats = trailStore(state => state.trailStats[trailId] || null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await trailApplication.getTrailStats(trailId)

      if (result.success && result.data) {
        getTrailStoreActions().setTrailStats(trailId, result.data)
      } else {
        const errorMessage = result.error?.message || 'Failed to fetch trail stats'
        logger.error('Error fetching trail stats:', errorMessage)
        setError(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error('Unexpected error fetching trail stats:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!stats && !loading) {
      fetchStats()
    }
  }, [trailId])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}
