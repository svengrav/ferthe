import { StyleSheet, View } from 'react-native'

import { Avatar, Button, Page, Stack, Text } from '@app/shared/components'
import Item from '@app/shared/components/item/Item'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'

import { useLocalization } from '@app/shared/localization/index.ts'
import { getAppContextStore } from '@app/shared/stores/appContextStore.ts'
import { useAccountData } from '../stores/accountStore'
import AccountVerification from './AccountVerificationCard.tsx'
import AvatarUpload from './AvatarUploadCard.tsx'

/**
 * Hook to open/close the account page overlay.
 */
export const useAccountPageOverlay = () => ({
  open: () => {
    const close = setOverlay('accountPage', <AccountPage onBack={() => close()} />)
    return close
  },
  close: () => closeOverlay('accountPage')
})

interface AccountPageProps {
  onBack?: () => void
}

/**
 * Account view displaying user profile information and settings.
 * Allows editing of display name, description, avatar and account verification.
 */
function AccountPage(props: AccountPageProps) {
  const { onBack } = props
  const { styles, theme } = useTheme(createStyles)
  const { locales } = useLocalization()
  const { account, accountType } = useAccountData()
  const { accountApplication } = getAppContextStore()

  // Update account field with new value
  const handleEdit = async (field: string, value: string) => {
    await accountApplication.updateAccount({ [field]: value })
  }

  // Open account verification overlay
  const showAccountRegistration = () => {
    const close = setOverlay(
      'accountVerification',
      <AccountVerification onClose={() => close()} />,
    )
  }

  // Open avatar upload overlay
  const handleAvatarPress = () => {
    const close = setOverlay(
      'avatarUpload',
      <AvatarUpload onSubmit={() => close()} onClose={() => close()} />,
    )
  }

  return (
    <Page
      title={locales.account.myAccount}
      leading={<Button icon="arrow-back" variant='outlined' onPress={onBack} />}
      trailing={<Button
        icon="more-vert"
        variant="outlined"
        options={[]}
      />}
    >
      <Stack style={{ paddingVertical: theme.tokens.spacing.lg }} >
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
          label={locales.account.displayName}
          value={account?.displayName || locales.account.notSet}
          editable
          onSubmitEdit={(value) => handleEdit('displayName', value)}
        />

        {/* Description Editor */}
        <Item
          icon="text-snippet"
          label={locales.account.description}
          value={account?.description || locales.account.notSet}
          editable
          type='multiline'
          onSubmitEdit={(value) => handleEdit('description', value)}
        />

        {/* Account Status */}
        <Item
          icon="account-circle"
          label={locales.account.accountStatus}
          value={accountType === 'sms_verified'
            ? locales.account.phoneAccount
            : locales.account.localAccount}
        />

        {/* Account ID */}
        <Item
          icon="badge"
          label={locales.account.accountId}
          value={account?.id}
        />

        {/* Feature Access */}
        <Item
          icon="sync"
          label={locales.account.featureAccess}
          value={accountType === 'local_unverified'
            ? locales.account.localAccountDescription
            : accountType === 'sms_verified'
              ? locales.account.phoneAccountDescription
              : locales.account.loginToSync}
        />

        {/* Upgrade Button for unverified accounts */}
        {accountType === 'local_unverified' && (
          <View style={styles.upgradeContainer}>
            <Button
              label={locales.account.upgradeNow}
              variant="primary"
              onPress={showAccountRegistration}
            />
            <Text variant="hint" style={styles.upgradeHint}>
              {locales.account.upgradeToUnlock}
            </Text>
          </View>
        )}
      </Stack>
    </Page>
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

export default AccountPage