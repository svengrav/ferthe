import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { LanguageOptions, Settings, ThemeMode } from '../types/types'

interface SettingsStore {
  settings: Settings
  isLoading: boolean
  saveSettings: (settings: Partial<Settings>) => void
}

const settingsStore = create<SettingsStore>()(
  persist(
    set => ({
      isLoading: false,
      settings: {
        theme: ThemeMode.Dark,
        language: LanguageOptions.English,
      },
      saveSettings: (updatedSettings: Partial<Settings>) => {
        set(state => ({
          settings: {
            ...state.settings,
            ...updatedSettings,
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

export default settingsStore
