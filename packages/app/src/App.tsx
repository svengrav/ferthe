// Metro Runtime has to be imported before any other imports that use the runtime.
// Hot reloading and other features depend on this.
// Web Only:
import '@expo/metro-runtime'
// ---------------------------------------
import { Snackbar, SplashView } from '@app/shared/components'
import { Navigation } from '@app/shared/navigation/Navigation'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AccountAuthWrapper from './features/account/components/AccountAuthWrapper'
import { useInitializationPipeline } from './init/useInitializationPipeline'
import { OverlayProvider } from './shared/overlay'

SplashScreen.preventAutoHideAsync()

export default function App() {
  const { isReady } = useInitializationPipeline()


  if (!isReady) {
    return <SplashView />
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView>
        <Snackbar />
        <AccountAuthWrapper>
          <Navigation />
        </AccountAuthWrapper>
        <OverlayProvider />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  )
}