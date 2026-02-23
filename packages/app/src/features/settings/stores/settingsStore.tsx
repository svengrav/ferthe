import { config } from '@app/config'
import { createStateStorage, createStoreConnector } from '@app/shared/device'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { AppFlags, LanguageOptions, Settings, ThemeMode } from '../types/types'

// Create store connector for settings persistence
const storeConnector = createStoreConnector({
  json: { baseDirectory: config.storage.jsonStoreUrl },
  type: config.storage.type,
})

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
      name: 'settings',
      storage: createJSONStorage(() => createStateStorage(storeConnector)),
      onRehydrateStorage: () => state => {
        if (state) {
          state.isLoading = false
        }
      },
    }
  )
)

export default settingsStore
