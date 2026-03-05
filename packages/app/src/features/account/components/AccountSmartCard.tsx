import { Avatar, Card, Text } from '@app/shared/components'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { usePublicProfile } from '../stores/publicProfileStore'
import { usePublicProfilePage } from './PublicProfilePage'

const AVATAR_SIZE = 44

interface AccountSmartCardProps {
  accountId: string
  style?: StyleProp<ViewStyle>
  onPress?: () => void
}

/**
 * Compact account card showing avatar, display name and spot count.
 * Fetches public profile from API if not yet in store.
 */
function AccountSmartCard({ accountId, style, onPress }: AccountSmartCardProps) {
  const { styles } = useTheme(useStyles)
  const profile = usePublicProfile(accountId)
  const { showPublicProfile } = usePublicProfilePage()

  const handlePress = onPress ?? (() => accountId && showPublicProfile(accountId))

  return (
    <Pressable onPress={handlePress} style={{ ...StyleSheet.flatten(style) }} >
      <View style={styles.content} id="account-smart-card">
        <Avatar size={AVATAR_SIZE} avatar={profile?.avatar} label={profile?.displayName} />
        <View style={styles.info}>
          <Text variant="label" >{profile?.displayName ?? 'Fox'}</Text>
          <View style={styles.stats}>
            <Text variant="body" size="sm">{profile?.spotCount ?? 0} Spots</Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

const useStyles = createThemedStyles(theme => ({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.tokens.spacing.md,
  },
  info: {
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    gap: theme.tokens.spacing.md,
  },
}))

export default AccountSmartCard
