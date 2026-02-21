import { SpotCardList } from '@app/features/spot/components'
import { Text } from '@app/shared/components'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { View } from 'react-native'
import { TrailSpotRowVM } from '../types/viewModels'

interface TrailSpotsProps {
  spots: TrailSpotRowVM[]
}

/**
 * Displays all spots in a trail with discovered and undiscovered status.
 * Discovered spots show the full image, undiscovered spots show blurred image with lock icon.
 * 
 * This is a pure presentation component that receives pre-composed view model data.
 */
function TrailSpots({ spots }: TrailSpotsProps) {
  const { styles } = useTheme(useStyles)
  const { locales } = useApp()

  if (!styles) return null

  const discoveredCount = spots.filter(s => s.discovered).length
  const totalSpots = spots.length

  if (totalSpots === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{locales.trails.allSpotsDiscovered}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text variant="heading">
        {locales.trails.spots}
      </Text>
      <Text style={styles.description}>
        {discoveredCount} / {totalSpots} {locales.trails.spots} {locales.discovery.discovered.toLowerCase()}
      </Text>
      <SpotCardList
        items={spots.map(spot => ({
          id: spot.id,
          image: spot.image,
          title: spot.title,
          blurredImage: spot.blurredImage,
          isLocked: !spot.discovered,
        }))}
      />
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
  },
  heading: {
    marginBottom: theme.tokens.spacing.sm,
  },
  description: {
    marginBottom: theme.tokens.spacing.md,
    color: theme.deriveColor(theme.colors.onSurface, 0.6),
  },
  emptyContainer: {
    padding: theme.tokens.inset.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.deriveColor(theme.colors.onSurface, 0.6),
  },
}))

export default TrailSpots
