import { Button, CheckboxGroup, Stack, Text } from '@app/shared/components'
import { useApp } from '@app/shared/useApp'

interface ConsentState {
  [key: string]: boolean
  permission: boolean
  copyright: boolean
  appropriate: boolean
  privacy: boolean
  responsibility: boolean
}

interface SpotConsentFormProps {
  consent: ConsentState
  onConsentChange: (consent: ConsentState) => void
  onSubmit: () => void
  isSubmitting: boolean
}

const CONSENT_KEYS = ['permission', 'copyright', 'appropriate', 'privacy', 'responsibility'] as const

/**
 * Step 3: User must confirm all consent conditions before creation.
 */
function SpotConsentForm(props: SpotConsentFormProps) {
  const { consent, onConsentChange, onSubmit, isSubmitting } = props
  const { locales } = useApp()

  const consentItems = CONSENT_KEYS.map(key => ({
    key,
    label: {
      permission: locales.spotCreation.consentPermission,
      copyright: locales.spotCreation.consentCopyright,
      appropriate: locales.spotCreation.consentAppropriate,
      privacy: locales.spotCreation.consentPrivacy,
      responsibility: locales.spotCreation.consentResponsibility,
    }[key],
  }))

  const allConsented = CONSENT_KEYS.every(key => consent[key])

  return (
    <Stack spacing="md">
      <Text variant="section">{locales.spotCreation.consentTitle}</Text>

      <CheckboxGroup
        items={consentItems}
        checked={consent}
        onChange={onConsentChange}
      />

      <Button
        label={isSubmitting ? locales.spotCreation.creating : locales.spotCreation.createSpot}
        variant="primary"
        onPress={onSubmit}
        disabled={!allConsented || isSubmitting}
      />
    </Stack>
  )
}

export default SpotConsentForm
