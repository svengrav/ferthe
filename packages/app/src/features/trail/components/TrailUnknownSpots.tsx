import { useDiscoveryData } from '@app/features/discovery'
import { Icon, Text } from '@app/shared/components'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { Image, View } from 'react-native'
import { useTrailPreviewSpots } from '../stores/trailStore'

const MAX_PREVIEW_SPOTS = 4
const CARD_SIZE = 100
const CARD_SPACING = 12

interface TrailUnknownSpotsProps {
  trailId: string
}

/**
 * Displays preview cards of unknown (not yet discovered) spots in a trail.
 * Shows max 4 spots with blurred images.
 */
function TrailUnknownSpots({ trailId }: TrailUnknownSpotsProps) {
  const { styles } = useTheme(useStyles)
  const { locales } = useApp()
  const { discoveries } = useDiscoveryData()
  const spotPreviews = useTrailPreviewSpots(trailId)

  if (!styles) return null

  // Get discovered spot IDs
  const discoveredSpotIds = new Set(discoveries.map(d => d.spotId))

  // Filter unknown spots (not discovered yet)
  const unknownSpots = spotPreviews
    .filter(spot => !discoveredSpotIds.has(spot.id))
    .slice(0, MAX_PREVIEW_SPOTS)

  if (unknownSpots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{locales.trails.allSpotsDiscovered}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text variant="section" style={styles.heading}>
        {locales.trails.unknownSpots}
      </Text>
      <Text style={styles.description}>
        {unknownSpots.length} {unknownSpots.length === 1 ? locales.trails.spot : locales.trails.spots} {locales.trails.toDiscover}
      </Text>
      <View style={styles.grid}>
        {unknownSpots.map((spot) => (
          <View key={spot.id} style={styles.card}>
            {spot.image?.previewUrl ? (
              <Image
                source={{ uri: spot.image.previewUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholder} />
            )}
            <View style={styles.lockIconContainer}>
              <Icon name="lock" size={32} color="white" />
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    padding: theme.tokens.inset.md,
  },
  heading: {
    marginBottom: theme.tokens.spacing.sm,
  },
  description: {
    marginBottom: theme.tokens.spacing.md,
    color: theme.deriveColor(theme.colors.onSurface, 0.6),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_SPACING,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: theme.tokens.borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.colors.surface,
    elevation: 2,
    shadowColor: theme.colors.onSurface,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.deriveColor(theme.colors.surface, 0.3),
  },
  lockIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: theme.tokens.inset.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.deriveColor(theme.colors.onSurface, 0.6),
  },
}))

export default TrailUnknownSpots
