import { useLocalizationStore } from '@app/shared/localization'
import { setTheme } from '@app/shared/theme/themeStore'
import { useEffect } from 'react'
import settingsStore from '../stores/settingsStore'

/**
 * Synchronizes persisted settings with theme and localization stores on app start.
 * Ensures that user preferences are applied immediately after rehydration.
 */
export function useSettingsSync() {
  useEffect(() => {
    const { settings } = settingsStore.getState()
    const { setLocalization } = useLocalizationStore.getState()

    // Sync theme and language from persisted settings
    if (settings.theme) {
      setTheme(settings.theme)
    }
    if (settings.language) {
      setLocalization(settings.language)
    }
  }, [])
}
