import { Button, Checkbox, Stack, Text } from '@app/shared/components'
import { Theme, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { ScrollView, StyleSheet, View } from 'react-native'

interface SpotConsentFormProps {
  consent: boolean
  onConsentChange: (value: boolean) => void
  onSubmit: () => void
  isSubmitting: boolean
}

/**
 * Step 3: Conditions text box + single confirm checkbox before creation.
 */
function SpotConsentForm(props: SpotConsentFormProps) {
  const { consent, onConsentChange, onSubmit, isSubmitting } = props
  const { locales } = useApp()
  const { styles } = useTheme(createStyles)

  return (
    <Stack spacing="md">
      <Text variant="section">{locales.spotCreation.consentTitle}</Text>

      <View style={styles.textBox}>
        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
          <Text variant="body">{locales.spotCreation.consentText}</Text>
        </ScrollView>
      </View>

      <Checkbox
        checked={consent}
        onPress={() => onConsentChange(!consent)}
        label={locales.spotCreation.consentAgree}
      />

      <Button
        label={isSubmitting ? locales.spotCreation.creating : locales.spotCreation.createSpot}
        variant="primary"
        onPress={onSubmit}
        disabled={!consent || isSubmitting}
      />
    </Stack>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  textBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.tokens.borderRadius.md,
    padding: theme.tokens.inset.md,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
})

export default SpotConsentForm
