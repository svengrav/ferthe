import { StyleSheet, View } from 'react-native'
import { z } from 'zod'

import { Button, Form, FormPicker, Page, Text, useFormSubmitWatcher } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { closeOverlay, setOverlay } from '@app/shared/overlay/'
import { Theme, useTheme } from '@app/shared/theme'

import useSettings from '../hooks/useSettings'
import { LanguageOptions, Settings, ThemeMode } from '../types/types'

const settingsSchema = z.object({
  language: z.enum(LanguageOptions),
  theme: z.enum(ThemeMode),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export const useSettingsPage = () => ({
  showSettings: () => setOverlay(
    'settingsForm',
    <SettingsPage
      onClose={() => closeOverlay('settingsForm')}
      onSubmit={() => { }} // Auto-save via useFormSubmitWatcher, don't close
    />
  ),
  closeSettings: () => closeOverlay('settingsForm'),
})

interface SettingsFormProps {
  onClose: () => void
  onSubmit: (settings: Settings) => void
}

/**
 * Settings page for managing user preferences (language, theme)
 */
function SettingsPage(props: SettingsFormProps) {
  const { onClose, onSubmit } = props
  const { styles, theme } = useTheme(createStyles)
  const { t } = useLocalizationStore()
  const { initialValues, handleSubmit: processSettings } = useSettings()

  const onFormSubmit = (values: SettingsFormValues) => {
    const updatedSettings = processSettings(values)
    onSubmit(updatedSettings)
  }

  // Internal component to use useFormSubmitWatcher hook inside Form context
  function AutoSaveSettings() {
    useFormSubmitWatcher<SettingsFormValues>(onFormSubmit)
    return null
  }

  return (
    <Page
      title={t.settings.yourSettings}
      leading={<Button icon="arrow-back" variant='outlined' onPress={onClose} />}
    >
      <Form<SettingsFormValues>
        schema={settingsSchema}
        defaultValues={initialValues}
        onSubmit={onFormSubmit}
      >
        <AutoSaveSettings />
        <View style={{ marginTop: theme.tokens.spacing.lg }}>
          <View style={styles.settingRow}>
            <Text variant='body'>{t.settings.chooseLanguage}</Text>
            <FormPicker
              variant='secondary'
              name="language"
              options={[
                { label: 'German', value: LanguageOptions.German },
                { label: 'English', value: LanguageOptions.English },
              ]}
            />
          </View>

          <View style={styles.settingRow}>
            <Text variant='body'>{t.settings.forestIs}</Text>
            <FormPicker
              variant='secondary'
              name="theme"
              options={[
                { label: t.settings.dark, value: ThemeMode.Dark },
              ]}
            />
          </View>
        </View>
      </Form>
    </Page>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.tokens.spacing.md,
  },
})

export { SettingsPage }
