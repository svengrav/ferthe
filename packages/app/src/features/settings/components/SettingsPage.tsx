import { Button, Form, FormPicker, Page, Text, useFormSubmitWatcher } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { closeOverlay, setOverlay } from '@app/shared/overlay/'
import { View } from 'react-native'
import { z } from 'zod'
import useSettings from '../hooks/useSettings'
import { LanguageOptions, Settings, ThemeMode } from '../types/types'

const settingsSchema = z.object({
  language: z.nativeEnum(LanguageOptions),
  theme: z.nativeEnum(ThemeMode),
})

export const useSettingsPage = () => ({
  showSettings: () => setOverlay(
    'settingsForm',
    <SettingsPage
      onClose={() => closeOverlay('settingsForm')}
      onSubmit={() => closeOverlay('settingsForm')}
    />
  ),
  closeSettings: () => closeOverlay('settingsForm'),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

interface SettingsFormProps {
  onClose: () => void
  onSubmit: (settings: Settings) => void
}

function FormContent({ onFormSubmit }: { onFormSubmit: (values: SettingsFormValues) => void }) {
  const { t } = useLocalizationStore()

  useFormSubmitWatcher(onFormSubmit)

  return (
    <>
      <Text variant='heading'>{t.settings.yourSettings}</Text>
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
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

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text variant='body'>{t.settings.forestIs}</Text>
          <FormPicker
            variant='secondary'
            name="theme"
            options={[
              // { label: t.settings.light, value: ThemeMode.Light },
              { label: t.settings.dark, value: ThemeMode.Dark },
            ]}
          />
        </View>
      </View>
    </>
  )
}

export const SettingsPage = ({ onClose, onSubmit }: SettingsFormProps) => {
  const { initialValues, handleSubmit: processSettings } = useSettings()

  const onFormSubmit = (values: SettingsFormValues) => {
    const updatedSettings = processSettings(values)
    onSubmit(updatedSettings)
  }

  return (
    <Page
      title={'Settings'}
      leading={<Button icon="arrow-back" variant='outlined' onPress={onClose} />}
      trailing={<Button
        icon="more-vert"
        variant="outlined"
        options={[]}
      />}
    >

      <Form<SettingsFormValues>
        schema={settingsSchema}
        defaultValues={initialValues}
        onSubmit={onFormSubmit}
      >
        <FormContent onFormSubmit={onFormSubmit} />
      </Form>
    </Page>
  )
}
