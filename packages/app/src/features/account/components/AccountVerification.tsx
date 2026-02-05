import { getAppContext } from '@app/appContext'
import { Theme } from '@app/shared'
import { Form, FormInput, FormSubmitButton, Text } from '@app/shared/components'
import { useApp } from '@app/shared/useApp'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { z } from 'zod'

// Constants
const PHONE_VERIFICATION_NOTICE = "Your number will only be used once and won't be stored."

// Validation schemas
const phoneSchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits').regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone number format'),
})

const codeSchema = z.object({
  verificationCode: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d{6}$/, 'Code must be numeric'),
})

type PhoneFormData = z.infer<typeof phoneSchema>
type CodeFormData = z.infer<typeof codeSchema>

/**
 * Custom hook to handle account verification logic
 * Manages phone number verification and SMS code handling
 */
const useAccountVerification = () => {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showCodeInput, setShowCodeInput] = useState(false)

  const { accountApplication } = getAppContext()

  const handleRequestSmsCode = async (data: PhoneFormData) => {
    const result = await accountApplication.requestSMSCode(data.phoneNumber.trim())

    if (result.success) {
      setPhoneNumber(data.phoneNumber)
      setShowCodeInput(true)
      setError(null)
    } else {
      setError(result.error?.message || 'Failed to request SMS code')
    }
  }

  const handleVerifyCode = async (data: CodeFormData) => {
    const result = await accountApplication.verifySMSCode(phoneNumber, data.verificationCode)
    if (!result.success) {
      setError(result.error?.message || 'Verification failed')
    }
  }

  return {
    showCodeInput,
    error,
    handleRequestSmsCode,
    handleVerifyCode,
  }
}

/**
 * Account verification component for phone number and SMS code verification
 * Handles both local account creation and phone-based verification
 */
function AccountVerification() {
  const { showCodeInput, error, handleRequestSmsCode, handleVerifyCode } = useAccountVerification()
  const { styles, locales } = useApp(useStyles)

  return (
    <>
      {!showCodeInput && (
        <View style={styles!.section}>
          <Text variant="title">{locales.auth.enterPhoneNumber}</Text>
          {error && <Text style={styles!.error}>{error}</Text>}
          <Form<PhoneFormData>
            schema={phoneSchema}
            defaultValues={{ phoneNumber: '' }}
            onSubmit={handleRequestSmsCode}
          >
            <FormInput
              name="phoneNumber"
              placeholder={locales.account.yourPhoneNumber}
              keyboardType="phone-pad"
              helperText={PHONE_VERIFICATION_NOTICE}
            />
            <FormSubmitButton
              label={locales.account.sendCode}
              variant="primary"
            />
          </Form>
        </View>
      )}
      {showCodeInput && (
        <View style={styles!.section}>
          <Text style={styles!.sectionTitle}>Enter Code</Text>
          <Form<CodeFormData>
            schema={codeSchema}
            defaultValues={{ verificationCode: '' }}
            onSubmit={handleVerifyCode}
          >
            <FormInput
              name="verificationCode"
              label={locales.account.verificationCode}
              placeholder={locales.account.yourVerificationCode}
              keyboardType="number-pad"
            />
            <FormSubmitButton
              label={locales.account.verifyCode}
              variant="primary"
            />
          </Form>
        </View>
      )}
    </>
  )
}

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    section: {
      flex: 1,
      gap: 12,
      marginBottom: 20,
    },
    error: {
      color: theme.colors.error,
      fontSize: 14,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      lineHeight: 26,
      textAlign: 'center',
      fontWeight: '400',
      marginBottom: 8,
      color: theme.colors.onBackground,
    },
  })

export default AccountVerification