import { useLocalization } from '@app/shared/localization'
import { setTheme } from '@app/shared/theme/themeStore'
import settingsStore from '../stores/settingsStore'
import { LanguageOptions, ThemeMode } from '../types/types'

function useSettings() {
  const { saveSettings, settings } = settingsStore()
  const { setLocalization } = useLocalization()

  const handleSubmit = values => {
    const updatedSettings = {
      ...settings,
      theme: values.theme,
      language: values.language,
      devApiEndpoint: values.devApiEndpoint ?? settings?.devApiEndpoint,
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
      devApiEndpoint: settings?.devApiEndpoint ?? 'http://localhost:7000/api/v1',
    },
    handleSubmit,
  }
}

export default useSettings
