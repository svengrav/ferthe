import { useLocalization } from '@app/shared/localization'
import { logger } from '@app/shared/utils/logger'
import { DiscoveryStats } from '@shared/contracts'
import { useEffect, useState } from 'react'
import { discoveryStore, getDiscoveryActions } from '../stores/discoveryStore'
import { getAppContextStore } from '@app/shared/stores/appContextStore'

interface UseDiscoveryStatsResult {
  stats: DiscoveryStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and cache DiscoveryStats for a given discovery.
 * Stats are cached in the discoveryStore to avoid redundant API calls.
 */
export const useDiscoveryStats = (discoveryId: string): UseDiscoveryStatsResult => {
  const { locales } = useLocalization()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const context = getAppContextStore()

  const stats = discoveryStore(state => state.discoveryStats[discoveryId] || null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await context.discoveryApplication.getDiscoveryStats(discoveryId)

      if (result.success && result.data) {
        getDiscoveryActions().setDiscoveryStats(discoveryId, result.data)
      } else {
        const errorMessage = result.error?.message || 'Failed to fetch discovery stats'
        logger.error('Error fetching discovery stats:', errorMessage)
        setError(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error('Unexpected error fetching discovery stats:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!stats && !loading) {
      fetchStats()
    }
  }, [discoveryId])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}
