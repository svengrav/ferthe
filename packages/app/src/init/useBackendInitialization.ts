import { useEffect } from 'react'
import { APIContext, createApiContext } from '../api'
import { config } from '../config'
import { getSession } from '../features/account'
import { logger } from '../shared/utils/logger'
import { useInitStore } from './initStore'

// Module-level ref so useAppContextInitialization can access the created context
let _apiContext: APIContext | null = null

export function getBackendApiContext(): APIContext | null {
  return _apiContext
}

/**
 * Hook that creates the API context and performs backend health check.
 * Waits until backend is available before setting backendReady flag.
 */
export function useBackendInitialization() {
  const { setBackendReady } = useInitStore()

  useEffect(() => {
    async function initializeBackend() {
      try {
        logger.log('[BackendInit] Creating API context...')

        const api = createApiContext({
          getAccountSession: getSession,
          apiEndpoint: config.api.endpoint,
          timeout: config.api.timeout,
        })

        _apiContext = api

        // Backend Health Check - wait until available
        logger.log('[BackendInit] Checking backend status...')
        while (true) {
          const status = await api.system.checkStatus().catch(() => ({ available: false }))

          if (status.available) {
            logger.log('[BackendInit] Backend is available')
            break
          }

          logger.log('[BackendInit] Backend not available, retrying in 3s...')
          await new Promise(resolve => setTimeout(resolve, 3000))
        }

        setBackendReady()
      } catch (error) {
        logger.error('[BackendInit] Failed to initialize backend:', error)
      }
    }

    initializeBackend()
  }, [])
}
