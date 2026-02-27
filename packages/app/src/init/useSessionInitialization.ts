import { useEffect } from 'react'
import { useAppContextStore } from '../shared/stores/appContextStore'
import { logger } from '../shared/utils/logger'
import { useInitStore } from './useInitializationPipeline'

/**
 * Hook that loads the session from storage.
 * Does not create an account, just loads existing session if available.
 * Depends on app context being ready.
 */
export function useSessionInitialization() {
  const { setSessionReady } = useInitStore()
  const appContextReady = useInitStore(state => state.appContextReady)
  const { context } = useAppContextStore()

  useEffect(() => {
    // Wait for app context to be ready
    if (!appContextReady || !context) {
      return
    }

    async function loadSession() {
      try {
        logger.log('[SessionInit] Loading session from storage...')

        await context?.accountApplication.initializeSession()

        logger.log('[SessionInit] Session loaded successfully')
        setSessionReady()
      } catch (error) {
        logger.error('[SessionInit] Failed to load session:', error)
        // Set ready anyway - no session is a valid state
        setSessionReady()
      }
    }

    loadSession()
  }, [appContextReady, context])
}
