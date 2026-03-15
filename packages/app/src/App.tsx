// Metro Runtime has to be imported before any other imports that use the runtime.
// Hot reloading and other features depend on this.
// Web Only:
import '@expo/metro-runtime'
// ---------------------------------------
import { Snackbar, SplashView } from '@app/shared/components'
import { Navigation } from '@app/shared/navigation/Navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { SystemUpdatePage } from './features/system/SystemUpdatePage'
import AccountAuthWrapper from './features/account/components/AccountAuthWrapper'
import { SystemWrapper } from './features/system/SystemWrapper'
import { useInitializationPipeline } from './init/useInitializationPipeline'
import { OverlayProvider } from './shared/overlay'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient()

export default function App() {
  const { isReady } = useInitializationPipeline()

  if (!isReady) {
    return <SplashView />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <GestureHandlerRootView>
          <SystemWrapper>
            <Snackbar />
            <AccountAuthWrapper>
              <Navigation />
            </AccountAuthWrapper>
            <OverlayProvider />
          </SystemWrapper>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}