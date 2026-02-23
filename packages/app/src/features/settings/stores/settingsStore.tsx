import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { AppFlags, LanguageOptions, Settings, ThemeMode } from '../types/types'

interface SettingsStore {
  settings: Settings
  isLoading: boolean
  saveSettings: (settings: Partial<Settings>) => void
  setFlag: (flag: Partial<AppFlags>) => void
}

const settingsStore = create<SettingsStore>()(
  persist(
    set => ({
      isLoading: false,
      settings: {
        theme: ThemeMode.Dark,
        language: LanguageOptions.English,
        flags: {
          hasSeenOnboarding: false,
        },
      },
      saveSettings: (updatedSettings: Partial<Settings>) => {
        set(state => ({
          settings: {
            ...state.settings,
            ...updatedSettings,
          },
        }))
      },
      setFlag: (flag: Partial<AppFlags>) => {
        set(state => ({
          settings: {
            ...state.settings,
            flags: { ...state.settings.flags, ...flag },
          },
        }))
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => state => {
        if (state) {
          state.isLoading = false
        }
      },
    }
  )
)

/**
 * Hook for managing the onboarding flag.
 * Returns the flag value and a setter function.
 */
export function useOnboardingFlag() {
  const hasSeenOnboarding = settingsStore(state => state.settings.flags?.hasSeenOnboarding ?? false)
  const setFlag = settingsStore(state => state.setFlag)

  const setHasSeenOnboarding = (value: boolean) => {
    setFlag({ hasSeenOnboarding: value })
  }

  return { hasSeenOnboarding, setHasSeenOnboarding }
}

export default settingsStore
