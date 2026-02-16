import { useDiscoveryData } from '@app/features/discovery'
import { Icon, Image, Text } from '@app/shared/components'
import { CARD_ASPECT_RATIO, CARD_BORDER_RADIUS } from '@app/shared/hooks/useCardDimensions'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { useWindowDimensions, View } from 'react-native'
import { useTrailStats } from '../hooks/useTrailStats'
import { useTrailPreviewSpots } from '../stores/trailStore'

const CARD_SPACING = 12
const CARDS_PER_ROW = 2

interface TrailUnknownSpotsProps {
  trailId: string
}

/**
 * Displays all spots in a trail with discovered and undiscovered status.
 * Discovered spots show the full image, undiscovered spots show blurred image with lock icon.
 */
function TrailUnknownSpots({ trailId }: TrailUnknownSpotsProps) {
  const { styles } = useTheme(useStyles)
  const { locales, theme } = useApp()
  const { discoveries, spots } = useDiscoveryData()
  const spotPreviews = useTrailPreviewSpots(trailId)
  const { stats } = useTrailStats(trailId)
  const { width: screenWidth } = useWindowDimensions()

  if (!styles) return null

  // Get discovered spot IDs for THIS trail only
  const trailDiscoveries = discoveries.filter(d => d.trailId === trailId)
  const discoveredSpotIds = new Set(trailDiscoveries.map(d => d.spotId))

  // Get discovered spots for THIS trail only (filter by trail discoveries)
  const discoveredTrailSpots = spots.filter(s => discoveredSpotIds.has(s.id))

  // Get undiscovered spots from previews for THIS trail
  const undiscoveredPreviews = spotPreviews.filter(p => !discoveredSpotIds.has(p.id))

  // Use stats for accurate counts - this is the source of truth
  const totalSpots = stats?.totalSpots || 0
  const discoveredCount = stats?.discoveredSpots || 0
  const undiscoveredCount = totalSpots - discoveredCount

  // Calculate card dimensions - Page already has horizontal padding (theme.tokens.inset.md)
  const pageInset = theme.tokens.inset.md
  const availableWidth = screenWidth - (pageInset * 2)
  const cardWidth = (availableWidth - CARD_SPACING) / CARDS_PER_ROW
  const cardHeight = cardWidth * CARD_ASPECT_RATIO

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
      <View style={styles.grid}>
        {/* Discovered spots with full image - limit to actual discovered count */}
        {discoveredTrailSpots.slice(0, discoveredCount).map((spot) => (
          <View key={spot.id} style={[styles.card, { width: cardWidth, height: cardHeight }]}>
            {spot.image ? (
              <Image
                source={spot.image}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholder} />
            )}
          </View>
        ))}
        {/* Undiscovered spots with blurred image and lock - limit to actual undiscovered count */}
        {undiscoveredPreviews.slice(0, undiscoveredCount).map((preview) => (
          <View key={preview.id} style={[styles.card, { width: cardWidth, height: cardHeight }]}>
            {preview.blurredImage ? (
              <Image
                source={preview.blurredImage}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholder} />
            )}
            <View style={styles.lockIconContainer}>
              <Icon name="lock" size={20} color="white" />
            </View>
          </View>
        ))}
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_SPACING,
  },
  card: {
    borderRadius: CARD_BORDER_RADIUS,
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
    backgroundColor: theme.colors.background,
    bottom: 4,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    borderRadius: 16,
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
