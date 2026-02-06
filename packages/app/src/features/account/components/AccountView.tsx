import { StyleSheet, View } from 'react-native'

import { getAppContext } from '@app/appContext'
import { Avatar, Button, InfoField, Stack, Text } from '@app/shared/components'
import Item from '@app/shared/components/item/Item'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'

import { useAccountData } from '../stores/accountStore'
import AccountVerification from './AccountVerification'
import AvatarUpload from './AvatarUpload'

/**
 * Account view displaying user profile information and settings.
 * Allows editing of display name, description, avatar and account verification.
 */
function AccountView() {
  const { styles } = useTheme(createStyles)
  const { t } = useLocalizationStore()
  const { account, accountType } = useAccountData()
  const { accountApplication } = getAppContext()

  // Update account field with new value
  const handleEdit = async (field: string, value: string) => {
    await accountApplication.updateAccount({ [field]: value })
  }

  // Open account verification overlay
  const showAccountRegistration = () => {
    setOverlay(
      'accountVerification',
      <AccountVerification />,
      { variant: 'compact', closable: true }
    )
  }

  // Open avatar upload overlay
  const handleAvatarPress = () => {
    const close = setOverlay(
      'avatarUpload',
      <AvatarUpload onSubmit={() => close()} />,
      { title: t.account.uploadAvatar, closable: true, variant: 'compact' }
    )
  }

  return (
    <Stack>

      {/* Profile Avatar */}
      <Avatar
        avatar={account?.avatar}
        label={account?.displayName}
        size={100}
        showEditIcon={true}
        onPress={handleAvatarPress}
      />

      {/* Display Name Editor */}
      <Item
        icon="person-2"
        label={t.account.displayName}
        value={account?.displayName || t.account.notSet}
        editable
        onSubmitEdit={(value) => handleEdit('displayName', value)}
      />

      {/* Description Editor */}
      <Item
        icon="text-snippet"
        label={t.account.description}
        value={account?.description || t.account.notSet}
        editable
        type='multiline'
        onSubmitEdit={(value) => handleEdit('description', value)}
      />

      {/* Account Status */}
      <Item
        icon="account-circle"
        label={t.account.accountStatus}
        value={accountType === 'sms_verified'
          ? t.account.phoneAccount
          : t.account.localAccount}
      />

      {/* Account ID */}
      <Item
        icon="badge"
        label={t.account.accountId}
        value={account?.id}
      />

      {/* Feature Access */}
      <InfoField
        icon="sync"
        label={t.account.featureAccess}
        value={accountType === 'local_unverified'
          ? t.account.localAccountDescription
          : accountType === 'sms_verified'
            ? t.account.phoneAccountDescription
            : t.account.loginToSync}
      />

      {/* Upgrade Button for unverified accounts */}
      {accountType === 'local_unverified' && (
        <View style={styles.upgradeContainer}>
          <Button
            label={t.account.upgradeNow}
            variant="primary"
            onPress={showAccountRegistration}
          />
          <Text variant="hint" style={styles.upgradeHint}>
            {t.account.upgradeToUnlock}
          </Text>
        </View>
      )}
    </Stack>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  upgradeContainer: {
    flex: 1,
  },
  upgradeHint: {
    textAlign: 'center',
    paddingTop: 8,
  },
})

export default AccountView