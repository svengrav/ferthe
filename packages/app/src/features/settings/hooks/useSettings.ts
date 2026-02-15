import { useLocalizationStore } from '@app/shared/localization'
import { setTheme } from '@app/shared/theme/themeStore'
import settingsStore from '../stores/settingsStore'
import { LanguageOptions, ThemeMode } from '../types/types'

function useSettings() {
  const { saveSettings, settings } = settingsStore()
  const { setLocalization } = useLocalizationStore()

  const handleSubmit = values => {
    const updatedSettings = {
      ...settings,
      theme: values.theme,
      language: values.language,
    }
    setLocalization(values.language)
    setTheme(values.theme)
    saveSettings(updatedSettings)
    return updatedSettings
  }

  return {
    settings,
    initialValues: {
      id: Date.now().toString(),
      theme: settings?.theme || ThemeMode.Dark,
      language: settings?.language || LanguageOptions.English,
    },
    handleSubmit,
  }
}

export default useSettings
