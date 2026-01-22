import { Picker, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { Theme, useThemeStore } from '@app/shared/theme'
import { Formik } from 'formik'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import useSettings from '../hooks/useSettings'
import { LanguageOptions, Settings, ThemeMode } from '../types/types'

interface SettingsFormProps {
  onClose: () => void
  onSubmit: (settings: Settings) => void
}

export const SettingsForm = ({ onClose, onSubmit }: SettingsFormProps) => {
  const theme = useThemeStore()
  const styles = createStyles(theme)
  const { t } = useLocalizationStore()
  const { initialValues, handleSubmit } = useSettings()

  return (
    <>
      {/* Settings Section */}
        <Text variant='heading'>{t.settings.yourSettings}</Text>
        <View style={{paddingHorizontal: 12}}> 
          <Formik
            initialValues={initialValues}
            enableReinitialize
            onSubmit={values => {
              const updatedSettings = handleSubmit(values)
              onSubmit(updatedSettings)
            }}>
            {({ values, setFieldValue, handleSubmit }) => (
              <View>
                <FormRow label={t.settings.chooseLanguage}>
                  <Picker
                    options={[
                      { label: 'German', value: LanguageOptions.German },
                      { label: 'English', value: LanguageOptions.English },
                    ]}
                    selected={values.language}
                    onValueChange={itemValue => {
                      setFieldValue(
                        'language',
                        itemValue === LanguageOptions.English ? LanguageOptions.English : LanguageOptions.German
                      )
                      handleSubmit()
                    }}
                  />
                </FormRow>

                <FormRow label={t.settings.forestIs}>
                  <Picker
                    options={[
                      { label: t.settings.light, value: ThemeMode.Light },
                      { label: t.settings.dark, value: ThemeMode.Dark },
                    ]}
                    selected={values.theme}
                    onValueChange={itemValue => {
                      const newMode = itemValue === ThemeMode.Dark ? ThemeMode.Dark : ThemeMode.Light
                      setFieldValue('theme', newMode)
                      handleSubmit()
                    }}
                  />
                </FormRow>
              </View>
            )}
          </Formik>
       </View>
    </>
  )
}

function FormRow({ label, children }: { label: string; children?: React.ReactNode }) {
  const theme = useThemeStore()
  const styles = createRowStyles(theme)

  return (
    <View style={styles.settingsRow}>
      <Text variant='body' >{label}</Text>
      {children}
    </View>
  )
}

const createRowStyles = (theme: Theme) => {
  return StyleSheet.create({
    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      color: theme.colors.onBackground,
    },
  })
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({

  })
