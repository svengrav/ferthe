import AccountSmartCard from '@app/features/account/components/AccountSmartCard.tsx'
import { Divider, Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { formatDate } from '@app/shared/utils/dateTimeUtils'
import { View } from 'react-native'
import { useTrailStats } from '../hooks/useTrailStats'
import TrailRating from './TrailRating'

interface TrailMetaCardProps {
  trailId: string
  createdAt: Date
  createdBy?: string
}

/**
 * Summary card for a trail showing rating, rank, creator and creation date.
 */
function TrailMetaCard({ trailId, createdAt, createdBy }: TrailMetaCardProps) {
  const { styles } = useTheme(useStyles)
  const { locales } = useLocalization()
  const { stats } = useTrailStats(trailId)

  if (!styles) return null

  const rankText = stats?.rank && stats.rank > 0
    ? `#${stats.rank} ${locales.trails.stats.of} ${stats.totalDiscoverers}`
    : '-'

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text variant="caption">{locales.trails.rating}</Text>
          <TrailRating trailId={trailId} style={styles.rating} />
        </View>
        <View style={styles.cell}>
          <Text variant="caption">{locales.trails.stats.rank}</Text>
          <Text variant="body">{rankText}</Text>
        </View>
      </View>
      <Divider />
      <View style={styles.row}>
        {createdBy && (
          <View style={styles.cell}>
            <Text variant="caption">{locales.spot.creator}</Text>
            <AccountSmartCard
              accountId={createdBy}
              variant="secondary"
              style={styles.accountCard}
            />
          </View>
        )}
        <View style={styles.cell}>
          <Text variant="caption">{locales.spot.created}</Text>
          <Text variant="body">{formatDate(createdAt)}</Text>
        </View>
      </View>
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.background,
    borderRadius: theme.tokens.borderRadius.md,
    padding: theme.tokens.spacing.md,
  },
  rating: {
    alignSelf: 'flex-start',
    paddingVertical: theme.tokens.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: theme.tokens.spacing.md,
  },
  cell: {
    flex: 1,
  },
  accountCard: {
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
}))

export default TrailMetaCard
