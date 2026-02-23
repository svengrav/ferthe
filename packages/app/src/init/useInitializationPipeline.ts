import { useAccountOnboarding } from "@app/features/account/"
import { useDiscoveryEventCard } from "@app/features/discovery/"
import { useSettingsSync } from "@app/features/settings/"
import { create } from "zustand/react"
import { useAppContextInitialization } from "./useAppContextInitialization"
import { useBackendInitialization } from "./useBackendInitialization"
import { useDataInitialization } from "./useDataInitialization"
import { useFontInitialization } from "./useFontInitialization"
import { usePushNotifications } from "./usePushNotifications"
import { useSessionInitialization } from "./useSessionInitialization"
import { useSplashScreenManager } from "./useSplashScreenManager"


interface InitState {
  fontsReady: boolean
  backendReady: boolean
  appContextReady: boolean
  sessionReady: boolean
  appReady: boolean
  dataReady: boolean
  pushReady: boolean
  setFontsReady: () => void
  setBackendReady: () => void
  setAppContextReady: () => void
  setSessionReady: () => void
  setAppReady: () => void
  setDataReady: () => void
  setPushReady: () => void
}

export const useInitStore = create<InitState>(set => ({
  fontsReady: false,
  backendReady: false,
  appContextReady: false,
  sessionReady: false,
  appReady: false,
  dataReady: false,
  pushReady: false,
  setFontsReady: () => set({ fontsReady: true }),
  setBackendReady: () => set({ backendReady: true }),
  setAppContextReady: () => set({ appContextReady: true }),
  setSessionReady: () => set({ sessionReady: true }),
  setAppReady: () => set({ appReady: true }),
  setDataReady: () => set({ dataReady: true }),
  setPushReady: () => set({ pushReady: true })
}))

export function useInitializationPipeline() {
  // Core initialization sequence (must run in order)
  useFontInitialization()
  useBackendInitialization()
  useAppContextInitialization()
  useSessionInitialization()

  // Splash screen management
  useSplashScreenManager()

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