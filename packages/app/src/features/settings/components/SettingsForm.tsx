import { Form, FormPicker, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { View } from 'react-native'
import { z } from 'zod'
import useSettings from '../hooks/useSettings'
import { LanguageOptions, Settings, ThemeMode } from '../types/types'

const settingsSchema = z.object({
  language: z.nativeEnum(LanguageOptions),
  theme: z.nativeEnum(ThemeMode),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

interface SettingsFormProps {
  onClose: () => void
  onSubmit: (settings: Settings) => void
}

function AutoSubmitWatcher({ onFormSubmit }: { onFormSubmit: (values: SettingsFormValues) => void }) {
  const { watch } = useFormContext<SettingsFormValues>()

  useEffect(() => {
    const subscription = watch((values) => {
      if (values.language && values.theme) {
        onFormSubmit(values as SettingsFormValues)
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, onFormSubmit])

  return null
}

export const SettingsForm = ({ onClose, onSubmit }: SettingsFormProps) => {
  const { initialValues, handleSubmit: processSettings } = useSettings()
  const { t } = useLocalizationStore()

  const onFormSubmit = (values: SettingsFormValues) => {
    const updatedSettings = processSettings(values)
    onSubmit(updatedSettings)
  }

  return (
    <Form<SettingsFormValues>
      schema={settingsSchema}
      defaultValues={initialValues}
      onSubmit={onFormSubmit}
    >
      <AutoSubmitWatcher onFormSubmit={onFormSubmit} />
      <Text variant='heading'>{t.settings.yourSettings}</Text>
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text variant='body'>{t.settings.chooseLanguage}</Text>
          <FormPicker
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
            name="theme"
            options={[
              // { label: t.settings.light, value: ThemeMode.Light },
              { label: t.settings.dark, value: ThemeMode.Dark },
            ]}
          />
        </View>
      </View>
    </Form>
  )
}
