// Metro Runtime has to be imported before any other imports that use the runtime.
// Hot reloading and other features depend on this.
// Web Only:
import '@expo/metro-runtime'
// ---------------------------------------
import { Notification, SplashView } from '@app/shared/components'
import { Navigation } from '@app/shared/navigation/Navigation'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AccountAuthWrapper from './features/account/components/AccountAuthWrapper'
import { useAppInitialization } from './init/useAppInitialization'
import { useDataInitialization } from './init/useDataInitialization'
import { usePushNotifications } from './init/usePushNotifications'
import { OverlayProvider } from './shared/overlay'

SplashScreen.preventAutoHideAsync()

export default function App() {
  const isReady = useAppInitialization()
  usePushNotifications()
  useDataInitialization()

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