import { useEffect } from 'react'
import { configureAppContext } from '../appContext'
import { config } from '../config'
import { getDeviceConnector } from '../features/sensor/device/deviceConnector'
import { createStoreConnector } from '../shared/device'
import { useAppContextStore } from '../shared/stores/appContextStore'
import { logger } from '../shared/utils/logger'
import { useInitStore } from './useInitializationPipeline'

/**
 * Hook that configures the app context with all required connectors.
 * Depends on backend being ready (API context must exist).
 */
export function useAppContextInitialization() {
  const { setAppContextReady } = useInitStore()
  const backendReady = useInitStore(state => state.backendReady)
  const { api } = useAppContextStore()

  useEffect(() => {
    // Wait for backend to be ready
    if (!backendReady || !api) {
      return
    }

    async function configureContext() {
      try {
        logger.log('[AppContextInit] Configuring app context...')

        const context = configureAppContext({
          environment: config.environment,
          apiContext: api!, // We checked for null above
          connectors: {
            deviceConnector: getDeviceConnector(),
            secureStoreConnector: createStoreConnector({
              json: { baseDirectory: config.storage.jsonStoreUrl },
              type: config.storage.type,
            }),
          },
        })

        useAppContextStore.getState().setContext(context)

        logger.log('[AppContextInit] App context configured successfully')
        setAppContextReady()
      } catch (error) {
        logger.error('[AppContextInit] Failed to configure app context:', error)
      }
    }

    configureContext()
  }, [backendReady, api])
}
