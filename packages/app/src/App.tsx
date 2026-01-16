// Metro Runtime has to be imported before any other imports that use the runtime.
// Hot reloading and other features depend on this.
// Web Only:
import '@expo/metro-runtime'
// ---------------------------------------
import { Notification, SplashScreenWrapper } from '@app/shared/components'
import { Navigation } from '@app/shared/navigation/Navigation'
import { useEffect, useState } from 'react'
import { LogBox } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { APIContext, createApiContext } from './api'
import { configureAppContext } from './appContext'
import { getAppConfig } from './env'
import AccountAuthWrapper from './features/account/components/AccountAuthWrapper'
import { getSession } from './features/account/stores/accountStore'
import { getDeviceConnector } from './features/sensor/device/deviceConnector'
import { createStoreConnector } from './shared/device'
import OverlayProvider from './shared/overlay/OverlayProvider'
import { useAppDimensions } from './shared/useApp'

LogBox.ignoreAllLogs()

let appInitialized = false

const initializeApp = async (apiContext: APIContext) => {
  if (appInitialized) return

  const APP_ENV_CONFIG = getAppConfig()

  configureAppContext({
    environment: APP_ENV_CONFIG.ENV_TYPE,
    apiContext,
    connectors: {
      deviceConnector: getDeviceConnector(),
      secureStoreConnector: createStoreConnector({
        json: {
          baseDirectory: APP_ENV_CONFIG.JSON_STORE_BASE_DIRECTORY,
        },
        type: APP_ENV_CONFIG.STORE_TYPE,
      }),
    },
  })

  appInitialized = true
}

export default function App() {
  const { setHeight, setWidth } = useAppDimensions()
  const [apiContext, setApiContext] = useState<APIContext | null>(null)

  useEffect(() => {
    const APP_ENV_CONFIG = getAppConfig()
    const context = createApiContext({
      getAccountSession: getSession,
      apiEndpoint: APP_ENV_CONFIG.API_ENDPOINT,
      timeout: APP_ENV_CONFIG.API_TIMEOUT,
    })
    setApiContext(context)
  }, [])

  useEffect(() => {
    if (apiContext) {
      initializeApp(apiContext)
    }
  }, [apiContext])

  return (
    <SafeAreaProvider onLayout={(e) => {
      const { height, width } = e.nativeEvent.layout
      setHeight(height)
      setWidth(width)
    }}>
      <SplashScreenWrapper checkStatus={apiContext?.system.checkStatus}>
        <GestureHandlerRootView>
          <Notification />
          <AccountAuthWrapper>
            <Navigation />
          </AccountAuthWrapper>
          <OverlayProvider />
        </GestureHandlerRootView>
      </SplashScreenWrapper>
    </SafeAreaProvider>
  )
}
