import { useAccountOnboarding } from "@app/features/account/"
import { useDiscoveryEventCard } from "@app/features/discovery/"
import { useSettingsSync } from "@app/features/settings/"
import { useInitStore } from "./initStore"
import { useAppContextInitialization } from "./useAppContextInitialization"
import { useBackendInitialization } from "./useBackendInitialization"
import { useDataInitialization } from "./useDataInitialization"
import { useFontInitialization } from "./useFontInitialization"
import { usePushNotifications } from "./usePushNotifications"
import { useSessionInitialization } from "./useSessionInitialization"
import { useSplashScreenManager } from "./useSplashScreenManager"
import { useVersionCheck } from "./useVersionCheck"

export { useInitStore } from "./initStore"

export function useInitializationPipeline() {
  // Core initialization sequence (must run in order)
  useFontInitialization()
  useBackendInitialization()
  useAppContextInitialization()
  useSessionInitialization()
  useVersionCheck()

  // Splash screen management
  useSplashScreenManager()

  // Version check — runs after backend is ready

  // Step 6-7: Parallel initialization of notifications and data
  usePushNotifications()
  useDataInitialization()

  // Step 8-10: Feature-specific initialization
  useSettingsSync()
  useDiscoveryEventCard()
  useAccountOnboarding()

  return {
    isReady: useInitStore(state => state.appReady)
  }
}