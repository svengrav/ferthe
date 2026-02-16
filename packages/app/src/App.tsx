// Metro Runtime has to be imported before any other imports that use the runtime.
// Hot reloading and other features depend on this.
// Web Only:
import '@expo/metro-runtime'
// ---------------------------------------
import { Notification, SplashView } from '@app/shared/components'
import { Navigation } from '@app/shared/navigation/Navigation'
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import {
  Merriweather_400Regular,
  Merriweather_600SemiBold,
  Merriweather_700Bold,
} from '@expo-google-fonts/merriweather'
import * as Font from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { LogBox } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { createApiContext } from './api'
import { configureAppContext } from './appContext'
import { config } from './config'
import { getSession } from './features/account/'
import AccountAuthWrapper from './features/account/components/AccountAuthWrapper'
import { getDeviceConnector } from './features/sensor/device/deviceConnector'
import { useSettingsSync } from './features/settings/hooks/useSettingsSync'
import { createStoreConnector } from './shared/device'
import { OverlayProvider } from './shared/overlay'
import { logger } from './shared/utils/logger'

SplashScreen.preventAutoHideAsync()

const useAppInitialization = () => {
  const [isReady, setIsReady] = useState(false)
  logger.log('App initialization started')
  useSettingsSync()

  useEffect(() => {
    async function initialize() {
      try {
        // Global Configuration
        LogBox.ignoreAllLogs()

        // Load Fonts
        await Font.loadAsync({
          Inter_400Regular,
          Inter_600SemiBold,
          Inter_700Bold,
          Merriweather_400Regular,
          Merriweather_600SemiBold,
          Merriweather_700Bold,
        }).catch(() => { })

        // Create API Context
        const api = createApiContext({
          getAccountSession: getSession,
          apiEndpoint: config.api.endpoint,
          timeout: config.api.timeout,
        })

        // Backend Health Check - wait until available
        while (true) {
          const status = await api.system.checkStatus().catch(() => ({ available: false }))
          logger.log('Backend status:', status)
          if (status.available) break
          await new Promise(resolve => setTimeout(resolve, 3000))
        }

        // Configure App Context
        const context = configureAppContext({
          environment: config.environment,
          apiContext: api,
          connectors: {
            deviceConnector: getDeviceConnector(),
            secureStoreConnector: createStoreConnector({
              json: { baseDirectory: config.storage.jsonStoreUrl },
              type: config.storage.type,
            }),
          },
        })

        // Load Trail and Discovery Data
        await Promise.all([
          context.trailApplication.requestTrailState(),
          context.discoveryApplication.requestDiscoveryState()
        ]).catch(error => logger.error('Error loading initial app data:', error))

        await SplashScreen.hideAsync()
        setIsReady(true)
      } catch (err) {
        logger.error('Error during app initialization:', err)
        await SplashScreen.hideAsync()
      }
    }

    initialize()
  }, [])
  return isReady
}

export default function App() {
  const isReady = useAppInitialization()

  if (!isReady) {
    return <SplashView />
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView>
        <Notification />
        <AccountAuthWrapper>
          <Navigation />
        </AccountAuthWrapper>
        <OverlayProvider />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  )
}