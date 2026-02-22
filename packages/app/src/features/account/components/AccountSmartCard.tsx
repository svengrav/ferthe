import { Avatar, Card, Text } from '@app/shared/components'
import { ThemedConfig, VariantOf, createThemedStyles, themedVariants, useTheme, useVariants } from '@app/shared/theme'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { usePublicProfile } from '../stores/publicProfileStore'
import { usePublicProfilePage } from './PublicProfilePage'

const AVATAR_SIZE = 44

const cardConfig = {
  variants: {
    variant: {
      primary: (t: any) => ({ backgroundColor: t.colors.primary }),
      secondary: (t: any) => ({ backgroundColor: t.colors.surface }),
      outlined: () => ({ backgroundColor: 'transparent' }),
    },
  },
  defaultVariants: { variant: 'secondary' as const },
} satisfies ThemedConfig<ViewStyle>

const nameConfig = {
  variants: {
    variant: {
      primary: (t: any) => ({ color: t.colors.onPrimary }),
      secondary: (t: any) => ({ color: t.colors.onSurface }),
      outlined: (t: any) => ({ color: t.colors.onSurface }),
    },
  },
  defaultVariants: { variant: 'secondary' as const },
} satisfies ThemedConfig<ViewStyle>

const cardVariants = themedVariants<ViewStyle>(cardConfig)
const nameVariants = themedVariants(nameConfig)

type AccountCardVariant = VariantOf<typeof cardConfig>

interface AccountSmartCardProps {
  accountId: string
  variant?: AccountCardVariant
  style?: StyleProp<ViewStyle>
  onPress?: () => void
}

/**
 * Compact account card showing avatar, display name and spot count.
 * Fetches public profile from API if not yet in store.
 */
function AccountSmartCard({ accountId, variant = 'secondary', style, onPress }: AccountSmartCardProps) {
  const { styles } = useTheme(useStyles)
  const profile = usePublicProfile(accountId)
  const { showPublicProfile } = usePublicProfilePage()

  const cardStyle = useVariants(cardVariants, { variant })
  const nameStyle = useVariants(nameVariants, { variant })

  const handlePress = onPress ?? (() => showPublicProfile(accountId))

  return (
    <Card onPress={handlePress} style={{ ...cardStyle, ...StyleSheet.flatten(style) }}>
      <View style={styles.content}>
        <Avatar size={AVATAR_SIZE} avatar={profile?.avatar} label={profile?.displayName} variant={variant} />
        <View style={styles.info}>
          <Text variant="label" style={nameStyle}>{profile?.displayName ?? 'Fox'}</Text>
          <View style={styles.stats}>
            <Text variant="body" size="sm">{profile?.spotCount ?? 0} Spots</Text>
          </View>
        </View>
      </View>
    </Card>
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
