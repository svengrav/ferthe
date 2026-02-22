import { View } from 'react-native'

import { Avatar, Button, Page, Stack, Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { createThemedStyles, useTheme } from '@app/shared/theme'

import { usePublicProfile } from '../stores/publicProfileStore'

/**
 * Hook to open/close the public profile page overlay.
 */
export const usePublicProfilePage = () => ({
  showPublicProfile: (accountId: string) => {
    const overlayId = `public-profile-${accountId}`
    return setOverlay(
      overlayId,
      <PublicProfilePage accountId={accountId} onClose={() => closeOverlay(overlayId)} />,
    )
  },
  closePublicProfile: (accountId: string) => closeOverlay(`public-profile-${accountId}`),
})

interface PublicProfilePageProps {
  accountId: string
  onClose?: () => void
}

/**
 * Read-only public profile view displaying another user's avatar, display name,
 * description and basic stats like spot count.
 */
function PublicProfilePage(props: PublicProfilePageProps) {
  const { accountId, onClose } = props
  const { styles, theme } = useTheme(useStyles)
  const { locales } = useLocalization()
  const profile = usePublicProfile(accountId)

  return (
    <Page
      title={profile?.displayName ?? locales.account.profile}
      leading={<Button icon="arrow-back" variant="outlined" onPress={onClose} />}
      loading={!profile}
    >
      <Stack spacing="lg">
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Avatar
            avatar={profile?.avatar}
            label={profile?.displayName}
            size={96}
          />
          <Text variant="heading" size="md">
            {profile?.displayName ?? locales.account.notSet}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text variant="heading" size="lg">{profile?.spotCount ?? 0}</Text>
            <Text variant="caption">{locales.account.spots}</Text>
          </View>
        </View>
      </Stack>
    </Page>
  )
}

const useStyles = createThemedStyles(theme => ({
  avatarContainer: {
    alignItems: 'center',
    gap: theme.tokens.spacing.md,
    paddingVertical: theme.tokens.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.tokens.spacing.xl,
    paddingVertical: theme.tokens.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.tokens.borderRadius.md,
  },
  statCell: {
    alignItems: 'center',
    gap: theme.tokens.spacing.xs,
  },
}))

export default PublicProfilePage
