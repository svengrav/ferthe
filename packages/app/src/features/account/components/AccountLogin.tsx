import { getAppContext } from '@app/appContext'
import Button from '@app/shared/components/button/Button'
import Card from '@app/shared/components/card/Card'
import Divider from '@app/shared/components/divider/Divider'
import Text from '@app/shared/components/text/Text'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { Theme, useThemeStore } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import AccountVerification from './AccountVerification'

interface AccountLoginProps {
  onAccountCreated?: () => void
  onClose?: () => void
}

const useAccountLogin = () => {


}

export default function AccountLogin({ onClose }: AccountLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isCreatingLocal, setIsCreatingLocal] = useState(false)
  const [isCreatingWithPhone, setIsCreatingWithPhone] = useState(false)
  const [codeVerifaction, setCodeVerification] = useState(false)
  const [isVerification, setIsVerification] = useState(false)
  const [smsConsent, setSmsConsent] = useState(false)
  const { accountApplication } = getAppContext()
  const theme = useThemeStore()
  const styles = createStyles(theme)
  const { t } = useLocalizationStore()

  const handleCreateLocalAccount = async () => {
    setIsCreatingLocal(true)
    await accountApplication.createLocalAccount()
  }

  const handleCodeVerification = async (code: string) => {
    setIsCreatingWithPhone(true)
    setIsVerification(true)

    const result = await accountApplication.verifySMSCode(phoneNumber, code)
    if (result.success) {
      logger.log('Code verified successfully')
    } else {
      logger.error('Code verification failed:', result.error)
    }

    setIsCreatingWithPhone(false)
    setIsVerification(false)
  }

  const handleSMSConsent = async () => {
    setSmsConsent(true)
  }

  const handleCreatePhoneAccount = async () => {
    setIsCreatingWithPhone(true)
    const result = await accountApplication.requestSMSCode(phoneNumber.trim())
    if (result.success) {
      logger.log('Code verified successfully')
    } else {
      logger.error('Code verification failed:', result.error)
    }
    setIsCreatingWithPhone(false)
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>

        <Text variant='heading'>{t.auth.welcomeToFerthe}</Text>

        {/* Phone Number Section */}
        <AccountVerification />

        {/* Divider */}
        <Divider text={t.auth.orCreateLocal} />

        {/* Local Account Section */}
        <View style={styles.section}>
          <Button
            label={t.account.skip}
            onPress={handleCreateLocalAccount}
            variant="outlined"
            disabled={isCreatingLocal}
          />
          <Text variant='hint'>{t.auth.localAccountNotice}</Text>
        </View>
      </Card>
    </View>
  )
}


const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 0,
      justifyContent: 'center',
    },
    card: {
      padding: 24,
    },
    section: {
      marginBottom: 24,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.onSurface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      fontSize: 16,
      color: theme.colors.onSurface,
      backgroundColor: theme.colors.surface,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.onSurface + '20',
    },
  })
}
