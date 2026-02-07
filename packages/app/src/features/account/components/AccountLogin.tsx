import { getAppContext } from '@app/appContext'
import { Button, Card, Divider, Text } from '@app/shared/components'
import { Theme, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useAccountVerificationCard } from './AccountVerificationCard'

interface AccountLoginProps {
  // onClose not needed - AccountAuthWrapper handles automatic dismissal via session check
}

/**
 * Hook for managing local account creation.
 */
const useAccountLogin = () => {
  const { accountApplication } = getAppContext()
  const [isCreatingLocal, setIsCreatingLocal] = useState(false)

  const handleCreateLocalAccount = async () => {
    setIsCreatingLocal(true)
    await accountApplication.createLocalAccount()
    setIsCreatingLocal(false)
  }

  return {
    handleCreateLocalAccount,
    isCreatingLocal,
  }
}

/**
 * Account login view component.
 * Provides options for phone verification or local account creation.
 * Rendered by AccountAuthWrapper when no session exists.
 */
function AccountLogin(props: AccountLoginProps) {
  const { styles } = useTheme(createStyles)
  const { locales } = useApp()
  const { showAccountVerificationCard } = useAccountVerificationCard()
  const { handleCreateLocalAccount, isCreatingLocal } = useAccountLogin()

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text variant='heading'>{locales.auth.welcomeToFerthe}</Text>

        {/* Phone Verification Section */}
        <View style={styles.section}>
          <Button
            label={locales.account.upgradeNow}
            onPress={showAccountVerificationCard}
            variant="primary"
          />
          <Text variant='hint'>{locales.account.upgradeToUnlock}</Text>
        </View>

        {/* Divider */}
        <Divider text={locales.auth.orCreateLocal} />

        {/* Local Account Section */}
        <View style={styles.section}>
          <Button
            label={locales.account.skip}
            onPress={handleCreateLocalAccount}
            variant="outlined"
            disabled={isCreatingLocal}
          />
          <Text variant='hint'>{locales.auth.localAccountNotice}</Text>
        </View>
      </Card>
    </View>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
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
  })

export default AccountLogin
