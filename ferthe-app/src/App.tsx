// Metro Runtime has to be imported before any other imports that use the runtime.
// Hot reloading and other features depend on this.
// Web Only:
import '@expo/metro-runtime'
// ---------------------------------------
import { Notification, SplashScreenWrapper } from '@app/shared/components'
import { Navigation } from '@app/shared/navigation/Navigation'
import { LogBox } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { createApiContext } from './api'
import { configureAppContext } from './appContext'
import { getAppConfig } from './env'
import AccountAuthWrapper from './features/account/components/AccountAuthWrapper'
import { getSession } from './features/account/stores/accountStore'
import { getDeviceConnector } from './features/sensor/device/deviceConnector'
import { createStoreConnector } from './shared/device'
import OverlayProvider from './shared/overlay/OverlayProvider'
import { useAppDimensions } from './shared/useApp'

LogBox.ignoreAllLogs()
const run = async () => {
  const APP_ENV_CONFIG = await getAppConfig()

  configureAppContext({
    environment: APP_ENV_CONFIG.FERTHE_ENV,
    apiContext: createApiContext({
      getAccountSession: getSession,
      apiEndpoint: APP_ENV_CONFIG.API_ENDPOINT,
    }),
    connectors: {
      deviceConnector: getDeviceConnector(),
      secureStoreConnector: createStoreConnector({
        json: {
          baseDirectory: APP_ENV_CONFIG.JSON_STORE_BASE_DIRECTORY
        },
        type: APP_ENV_CONFIG.STORE_TYPE
      })
    }
  })
}
run()

export default function App() {
  // execOnNative([registerForPushNotificationsAsync])
  // execOnNative([useNotificationHandler])
  const { setHeight, setWidth } = useAppDimensions()

  return (
    <SafeAreaProvider onLayout={(e) => {
      const { height, width } = e.nativeEvent.layout
      setHeight(height)
      setWidth(width)
    }}>
      <SplashScreenWrapper>
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
