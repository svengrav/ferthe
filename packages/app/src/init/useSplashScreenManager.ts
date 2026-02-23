import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { LogBox } from 'react-native'
import { logger } from '../shared/utils/logger'
import { useInitStore } from './useInitializationPipeline'

/**
 * Hook that manages the splash screen visibility.
 * Hides splash screen when session is ready and marks app as ready.
 * Also sets global configuration (LogBox).
 */
export function useSplashScreenManager() {
  const { setAppReady } = useInitStore()
  const sessionReady = useInitStore(state => state.sessionReady)

  useEffect(() => {
    // Global Configuration
    LogBox.ignoreAllLogs()
    logger.log('App initialization started')
  }, [])

  // Hide splash screen when session is ready
  useEffect(() => {
    if (!sessionReady) return

    async function finalize() {
      try {
        await SplashScreen.hideAsync()
        logger.log('App initialization completed')
        setAppReady()
      } catch (err) {
        logger.error('Error during app initialization finalization:', err)
        await SplashScreen.hideAsync()
      }
    }

    finalize()
  }, [sessionReady])
}
