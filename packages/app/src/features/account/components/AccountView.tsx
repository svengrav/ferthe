import { Avatar, Button, InfoField, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { setOverlay } from '@app/shared/overlay'
import { Theme } from '@app/shared/theme'
import useThemeStore from '@app/shared/theme/themeStore'
import { logger } from '@app/shared/utils/logger'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useAccountData } from '../stores/accountStore'
import AccountVerification from './AccountVerification'
import { AvatarUpload } from './AvatarUpload'
import { DescriptionEditor } from './DescriptionEditor'
import { DisplayNameEditor } from './DisplayNameEditor'


export const AccountView: React.FC = () => {
  const theme = useThemeStore()
  const { t } = useLocalizationStore()
  const { account, accountType } = useAccountData()
  const styles = createStyles(theme)

  const showAccountRegistration = () => {
    setOverlay('accountVerification', <AccountVerification />, { title: 'Verify your Account', variant: 'fullscreen', closable: true })
  }

  logger.log('[AccountView] Rendering with account:', account, 'accountType:', accountType)

  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Text variant="heading">{t.account.myAccount}</Text>

      {/* Profile Avatar */}
      <View style={styles.avatarContainer}>
        <Avatar
          avatarUrl={account?.avatarUrl}
          size={100}
          showEditIcon={true}
          onPress={() => {
            const close = setOverlay(
              'avatarUpload',
              <AvatarUpload onSubmit={() => close()} />,
              { title: 'Upload Avatar', closable: true, variant: 'compact' }
            )
          }}
        />
      </View>

      {/* Account Status Section */}
      {/* Display Name Editor */}
      <InfoField
        icon="person-2"
        label={t.account.displayName}
        value={account?.displayName || 'Not set'}
        onEdit={() => { const close = setOverlay('displayNameEditor', <DisplayNameEditor onSubmit={() => close()} />, { title: t.account.setDisplayName, closable: true, variant: 'compact' }) }}
      />

      {/* Description Editor */}
      <InfoField
        icon="text-snippet"
        label="Description"
        value={account?.description || 'Not set'}
        onEdit={() => { const close = setOverlay('descriptionEditor', <DescriptionEditor onSubmit={() => close()} />, { title: 'Set Description', closable: true, variant: 'compact' }) }}
      />

      <InfoField
        icon="account-circle"
        label={t.account.accountStatus}
        value={accountType === 'sms_verified'
          ? t.account.phoneAccount
          : t.account.localAccount}
      />
      <InfoField
        icon="badge"
        label={t.account.accountId}
        value={account?.id}
      />

      <InfoField
        icon="sync"
        label={t.account.featureAccess}
        value={accountType === 'local_unverified'
          ? t.account.localAccountDescription
          : accountType === 'sms_verified'
            ? t.account.phoneAccountDescription
            : t.account.loginToSync}
      />

      {/* Upgrade if not verified */}
      {accountType === 'local_unverified' && (
        <View style={{ flex: 1 }}>
          <Button
            style={{ alignSelf: 'center', marginTop: 20 }}
            label={'Upgrade now'}
            variant="primary"
            onPress={() => showAccountRegistration()} />
          <Text variant="hint" style={{ textAlign: 'center', paddingTop: 8 }}>
            {t.account.upgradeToUnlock}
          </Text>
        </View>
      )}
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  grid: {
    width: '100%',
    flexWrap: 'wrap',
    rowGap: 16,
    gap: 16,
  },
  content: {

  },
  title: {
    fontSize: 16,
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: 16
  },
  card: {
    width: '100%',
  },
  description: {
    color: theme.colors.onSurface,
  },
  actionSection: {
    gap: 5,
  },
})