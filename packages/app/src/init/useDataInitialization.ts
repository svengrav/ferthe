import { useAppContextStore } from '@app/shared/stores/appContextStore'
import { logger } from '@app/shared/utils/logger'
import { useEffect, useRef } from 'react'
import { useSession } from '../features/account/stores/accountStore'

/**
 * Hook that reactively loads trail and discovery data when a session is available.
 * Triggers on initial mount with session, and when session changes (e.g., after login/account creation).
 */
export function useDataInitialization() {
  const session = useSession()
  const { context } = useAppContextStore()
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    // No session yet - wait for user to login/create account
    if (!session) {
      hasLoadedRef.current = false
      return
    }

    // Already loaded for this session
    if (hasLoadedRef.current) {
      return
    }

    const loadData = async () => {
      logger.log('[DataInit] Loading trails and discoveries for account:', session.accountId)

      try {
        await Promise.all([
          context?.trailApplication.requestTrailState(),
          context?.discoveryApplication.requestDiscoveryState()
        ])

        hasLoadedRef.current = true
        logger.log('[DataInit] Data loaded successfully')
      } catch (error) {
        logger.error('[DataInit] Failed to load data:', error)
      }
    }

    loadData()
  }, [session?.accountId, context])
}
