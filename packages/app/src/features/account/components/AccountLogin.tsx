import { getAppContext } from '@app/appContext'
import { Button, Divider, Stack, Text } from '@app/shared/components'
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
    <View style={styles.container} id='account-login'>
      <Stack spacing='lg'>
        <Text variant='heading'>{locales.auth.welcomeToFerthe}</Text>

        {/* Phone Verification Section */}
        <View>
          <Button
            label={locales.account.upgradeNow}
            onPress={showAccountVerificationCard}
            variant="primary"
          />
          <Text variant='hint' align='center'>{locales.account.upgradeToUnlock}</Text>
        </View>

        {/* Divider */}
        <Divider text={locales.auth.orCreateLocal} />

        {/* Local Account Section */}
        <View>
          <Button
            label={locales.account.skip}
            onPress={handleCreateLocalAccount}
            variant="outlined"
            disabled={isCreatingLocal}
          />
          <Text variant='hint' align='center'>{locales.auth.localAccountNotice}</Text>
        </View>
      </Stack>
    </View>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
    },
  })

export default AccountLogin
