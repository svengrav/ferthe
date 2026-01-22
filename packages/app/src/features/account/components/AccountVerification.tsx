import { getAppContext } from '@app/appContext'
import { Theme } from '@app/shared'
import { Text } from '@app/shared/components'
import Button from '@app/shared/components/button/Button'
import type { FormRef } from '@app/shared/components/form/Form'
import Form from '@app/shared/components/form/Form'
import { useApp } from '@app/shared/useApp'
import { useRef, useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'

// Constants
const PHONE_VERIFICATION_NOTICE = "Your number will only be used once and won't be stored."

/**
 * Custom hook to handle account verification logic
 * Manages phone number verification and SMS code handling
 */
const useAccountVerification = () => {
  // User input states
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  // UI flow states
  const [showCodeInput, setShowCodeInput] = useState(false)

  // Loading states
  const [isRequestingSmsCode, setIsRequestingSmsCode] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)

  // Application context
  const { accountApplication } = getAppContext()

  // Event handlers
  const handleRequestSmsCode = async () => {
    // Validate form before submitting

    setIsRequestingSmsCode(true)
    const result = await accountApplication.requestSMSCode(phoneNumber.trim())

    if (result.success) {
      setShowCodeInput(true)
      setError(null)
    } else {
      setError(result.error?.message || 'Failed to request SMS code')
    }
    setIsRequestingSmsCode(false)
  }

  const handleVerifyCode = async (code: string) => {
    setIsVerifyingCode(true)

    const result = await accountApplication.verifySMSCode(phoneNumber, code)
    if (result.success) {
      // Handle successful verification
    } else {
      // Handle verification error
    }

    setIsVerifyingCode(false)
  }

  return {
    // User input
    phoneNumber,
    verificationCode,
    setPhoneNumber,
    setVerificationCode,

    // UI states
    showCodeInput,

    // Loading states
    isRequestingSmsCode,
    isVerifyingCode,

    // Event handlers
    handleRequestSmsCode,
    handleVerifyCode,

    error
  }
}

/**
 * Account verification component for phone number and SMS code verification
 * Handles both local account creation and phone-based verification
 */
function AccountVerification() {

  // Form ref for external control
  const formRef = useRef<FormRef>(null)

  // Custom hook for verification logic
  const {
    phoneNumber,
    verificationCode,
    showCodeInput,
    isRequestingSmsCode,
    isVerifyingCode,
    error,
    setPhoneNumber,
    setVerificationCode,
    handleRequestSmsCode,
    handleVerifyCode,
  } = useAccountVerification()

  // App context with theme, localization and styles
  const { styles, theme, locales } = useApp(useStyles)

  // TypeScript assertion since we know styles will be defined when styleFn is provided
  const componentStyles = styles!

  return (
    <>
      {!showCodeInput && (
        <View style={componentStyles.section}>
          <Text variant="title">{locales.auth.enterPhoneNumber}</Text>
          {error && <Text style={componentStyles.error}>{error}</Text>}
          <Form
            ref={formRef}
            fields={[
              {
                name: 'Phone number',
                placeholder: locales.auth.phoneNumberPlaceholder || 'Your phone number',
                type: 'number',
                value: phoneNumber,
                onChange: setPhoneNumber,
                required: true,
                description: PHONE_VERIFICATION_NOTICE,
                validation: (value) => {
                  if (!value) return 'Phone number is required'
                  if (!/^\+?[0-9]\d{1,14}$/.test(value)) return 'Invalid phone number'
                  return true
                }
              }
            ]}
            onSubmit={() => handleRequestSmsCode()}
            showDefaultActions={false}
          />
          <Button
            label={locales.auth.sendSms || 'Send Code'}
            style={{ alignSelf: 'center'}}
            onPress={handleRequestSmsCode}
            variant="primary"
            disabled={isRequestingSmsCode}
          />
        </View>
      )}
      {showCodeInput && (
        <View style={componentStyles.section}>
          <Text style={componentStyles.sectionTitle}>Enter Code</Text>
          <TextInput
            style={componentStyles.input}
            value={verificationCode}
            onChangeText={setVerificationCode}
            placeholder="Your verification code"
            placeholderTextColor={theme.deriveColor(theme.colors.onSurface, 0.5)}
            keyboardType="phone-pad"
          />
          <Button
            label="Verify Code"
            onPress={() => handleVerifyCode(verificationCode)}
            variant="primary"
            disabled={isVerifyingCode}
          />
        </View>
      )}
    </>
  )
}

const useStyles = (theme: Theme) =>
  StyleSheet.create({
    section: {
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
    input: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.deriveColor(theme.colors.onSurface, 0.5),
      color: theme.colors.onSurface,
    },
    notice: {
      fontSize: 14,
      color: theme.colors.onSurface,
      marginBottom: 16,
    },
  })

export default AccountVerification