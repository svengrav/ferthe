import { Avatar, Card, Text } from '@app/shared/components'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { useEffect } from 'react'
import { View } from 'react-native'
import { getSpotRatingSummary } from '../../discovery/stores/spotRatingStore'
import { useSpots } from '../../spot/stores/spotStore'
import { useAccountData } from '../stores/accountStore'

const AVATAR_SIZE = 44

/**
 * Hook: loads account from API if not yet in store.
 * Derives spot count and average rating from existing stores.
 */
const useAccountSmartCard = () => {
  const { account, accountId } = useAccountData()
  const allSpots = useSpots()

  useEffect(() => {
    if (!account) {
      getAppContextStore().accountApplication.getAccount()
    }
  }, [account])

  const ownSpots = allSpots.filter(s => s.createdBy === accountId)

  const avgRating = (() => {
    const summaries = ownSpots
      .map(s => getSpotRatingSummary(s.id))
      .filter(r => r && r.count > 0)
    if (!summaries.length) return null
    const avg = summaries.reduce((sum, r) => sum + r!.average, 0) / summaries.length
    return Math.round(avg * 10) / 10
  })()

  return { account, spotCount: ownSpots.length, avgRating }
}

interface AccountSmartCardProps {
  onPress?: () => void
}

/**
 * Compact account card: avatar, display name, spot count, avg rating.
 */
function AccountSmartCard({ onPress }: AccountSmartCardProps) {
  const { styles } = useTheme(useStyles)
  const { account, spotCount, avgRating } = useAccountSmartCard()

  return (
    <Card onPress={onPress}>
      <View style={styles.content}>
        <Avatar
          size={AVATAR_SIZE}
          avatar={account?.avatar}
          label={account?.displayName}
        />
        <View style={styles.info}>
          <Text variant="label">{account?.displayName ?? '—'}</Text>
          <View style={styles.stats}>
            <Text variant="body" size="sm">{spotCount} Spots</Text>
            {avgRating !== null && (
              <Text variant="body" size="sm">★ {avgRating}</Text>
            )}
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
