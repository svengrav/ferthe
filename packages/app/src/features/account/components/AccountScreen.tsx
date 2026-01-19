import { Button, Card, Page } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { OverlayContainer, setOverlay } from '@app/shared/overlay'
import { Theme } from '@app/shared/theme'
import { createLayoutTheme } from '@app/shared/theme/layout'
import useThemeStore from '@app/shared/theme/useThemeStore'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useAccountData } from '../stores/accountStore'
import AccountVerification from './AccountVerification'


const AccountScreen: React.FC = () => {
  const theme = useThemeStore()
  const { t } = useLocalizationStore()
  const { account, accountType } = useAccountData()

  const showAccountRegistration = () => {
    const close = setOverlay(<OverlayContainer title={'Verify your Account'} onClose={() => close()}><AccountVerification /></OverlayContainer>)
  }
  const styles = createStyles(theme)
  const comp = createLayoutTheme(theme)

  return (
    <Page>
      <Text style={comp.header}>{t.account.myAccount}</Text>

      {/* Account Status Section */}
      <View style={styles.grid}>
        <Card style={styles.card}>
          {account ? (
            <View style={styles.userInfo}>
              <Text style={comp.header}>{'Account'}</Text>
              <Text style={styles.userIdText}>
                {t.account.loggedInAs}: {account.id}
              </Text>
              <Text style={styles.accountTypeText}>
                {t.account.accountType}: {accountType === 'sms_verified'
                  ? t.account.phoneAccount
                  : t.account.localAccount}
              </Text>
            </View>
          ) : (
            <Text style={comp.textBase}>
              {t.account.notVerified}
            </Text>
          )}
        </Card>

        {/* Feature Access Information */}
        <Card style={styles.card}>
          <Text style={comp.section}>{t.account.featureAccess}</Text>
          <Text style={comp.textBase}>
            {accountType === 'local_unverified'
              ? t.account.localAccountDescription
              : accountType === 'sms_verified'
                ? t.account.phoneAccountDescription
                : t.account.loginToSync}
          </Text>

          {accountType === 'local_unverified' && (
            <View>

              <Button
                style={{ alignSelf: 'stretch', marginTop: 20 }}
                label={'Upgrade Now'}
                variant="primary"
                onPress={() => showAccountRegistration()} />
              <Text style={comp.hint}>
                {t.account.upgradeToUnlock}
              </Text>
            </View>
          )}
        </Card>
      </View>
    </Page>
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
  statusIndicator: {
    marginBottom: 5,
  },
  userInfo: {
    marginTop: 5,
  },
  userIdText: {
    color: theme.colors.onSurface,
  },
  accountTypeText: {
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

export default AccountScreen
