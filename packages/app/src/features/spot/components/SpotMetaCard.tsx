import AccountSmartCard from '@app/features/account/components/AccountSmartCard.tsx'
import SpotRating from '@app/features/spot/components/SpotRating.tsx'
import { Divider, Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { formatDate } from '@app/shared/utils/dateTimeUtils.ts'
import { View } from 'react-native'

interface SpotMetaCardProps {
  spotId: string
  createdBy: string
  createdAt: Date
  discoveredAt?: Date
}

/**
 * Summary card for a spot showing creator, rating and key timestamps.
 */
function SpotMetaCard({ spotId, createdBy, createdAt, discoveredAt }: SpotMetaCardProps) {
  const { styles, theme } = useTheme(useStyles)
  const { locales } = useLocalization()

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text variant="caption">{locales.spot.creator}</Text>
          <AccountSmartCard
            accountId={createdBy}
            variant="secondary"
            style={styles.accountCard}
          />
        </View>
        <View style={styles.cell}>
          <Text variant="caption">{locales.spot.rating}</Text>
          <SpotRating spotId={spotId} style={styles.rating} />
        </View>
      </View>
      <Divider />
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text variant="caption">{locales.spot.created}</Text>
          <Text variant="body">{formatDate(createdAt)}</Text>
        </View>
        <View style={styles.cell}>
          <Text variant="caption">{locales.discovery.discovered}</Text>
          <Text variant="body">{formatDate(discoveredAt)}</Text>
        </View>
      </View>
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  rating: {
    alignSelf: 'flex-start',
    paddingVertical: theme.tokens.spacing.sm
  },
  container: {
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.background,
    borderRadius: theme.tokens.borderRadius.md,
    padding: theme.tokens.spacing.md,
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

export default SpotMetaCard
