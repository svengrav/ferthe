import { Button, Card, InfoField, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { setOverlay } from '@app/shared/overlay'
import { Theme } from '@app/shared/theme'
import useThemeStore from '@app/shared/theme/useThemeStore'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useAccountData } from '../stores/accountStore'
import AccountVerification from './AccountVerification'


export const AccountView: React.FC = () => {
  const theme = useThemeStore()
  const { t } = useLocalizationStore()
  const { account, accountType } = useAccountData()

  const showAccountRegistration = () => {
    setOverlay(<AccountVerification />, { title: 'Verify your Account', variant: 'fullscreen', closable: true })
  }
  const styles = createStyles(theme)

  return (
    <View>
      <Text variant="heading">{t.account.myAccount}</Text>

      {/* Account Status Section */}
      <View style={styles.grid}>
        <Card style={styles.card}>
          {accountType ? (
            <View>
              <InfoField
                icon="account-circle"
                label={t.account.accountStatus}
                value={accountType === 'sms_verified'
                  ? t.account.phoneAccount
                  : t.account.localAccount}
              />
              {account?.id && (
                <InfoField
                  icon="badge"
                  label={t.account.accountId}
                  value={account.id}
                />
              )}
            </View>
          ) : (
            <InfoField
              icon="account-circle"
              label={t.account.accountStatus}
              value={t.account.notLoggedIn}
            />
          )}
        </Card>

        {/* Feature Access Information */}
        <Card style={styles.card}>
          <InfoField
            icon="sync"
            label={t.account.featureAccess}
            value={accountType === 'local_unverified'
              ? t.account.localAccountDescription
              : accountType === 'sms_verified'
                ? t.account.phoneAccountDescription
                : t.account.loginToSync}
          />

          {accountType === 'local_unverified' && (
            <View>

              <Button
                style={{ alignSelf: 'stretch', marginTop: 20 }}
                label={'Upgrade Now'}
                variant="primary"
                onPress={() => showAccountRegistration()} />
              <Text variant="caption">
                {t.account.upgradeToUnlock}
              </Text>
            </View>
          )}
        </Card>
      </View>
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  sectionTitle: {
    ...theme.text.size.md,
    color: theme.colors.onBackground,
  },
  description: {
    color: theme.colors.onSurface,
  },
  actionSection: {
    gap: 5,
  },
  upgradeHint: {
    ...theme.text.size.sm,
    color: theme.deriveColor(theme.colors.onSurface, 0.2),
    textAlign: 'center',
  },
})