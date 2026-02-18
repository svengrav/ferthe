import { useDiscoveryCardPage } from '@app/features/discovery/components/DiscoveryCardPage'
import { useSpots } from '@app/features/spot'
import { SpotCardList } from '@app/features/spot/components'
import { Text } from '@app/shared/components'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { useMemo } from 'react'
import { View } from 'react-native'
import { useTrailStats } from '../hooks/useTrailStats'
import { usePreviewSpots, useTrailSpotIds } from '../stores/trailStore'

interface TrailUnknownSpotsProps {
  trailId: string
}

/**
 * Displays all spots in a trail with discovered and undiscovered status.
 * Discovered spots show the full image, undiscovered spots show blurred image with lock icon.
 * Uses userStatus from API to determine discovery state.
 */
function TrailSpots({ trailId }: TrailUnknownSpotsProps) {
  const { styles } = useTheme(useStyles)
  const { locales } = useApp()
  const spots = useSpots()
  const trailSpotIds = useTrailSpotIds(trailId)
  const previewSpots = usePreviewSpots()
  const { stats } = useTrailStats(trailId)
  const { showDiscoveryCardDetails } = useDiscoveryCardPage()

  if (!styles) return null

  // Filter spots that belong to this trail
  const trailSpots = spots.filter(s => trailSpotIds.includes(s.id))

  // Get undiscovered spots (previews) that belong to this trail
  const undiscoveredPreviews = previewSpots.filter(p => trailSpotIds.includes(p.id))

  // Use stats for accurate counts - this is the source of truth
  const totalSpots = stats?.totalSpots || 0
  const discoveredCount = stats?.discoveredSpots || 0
  const undiscoveredCount = totalSpots - discoveredCount

  // Build display list with discovered and undiscovered spots
  const allSpots = useMemo(() => {
    const discovered = trailSpots.slice(0, discoveredCount).map(spot => ({
      id: spot.id,
      image: spot.image,
      title: spot.name,
      blurredImage: undefined,
      discovered: true,
    }))
    const undiscovered = undiscoveredPreviews.slice(0, undiscoveredCount).map(preview => ({
      id: preview.id,
      image: undefined,
      title: undefined,
      blurredImage: preview.blurredImage,
      discovered: false,
    }))
    return [...discovered, ...undiscovered]
  }, [trailSpots, undiscoveredPreviews, discoveredCount, undiscoveredCount])

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
        items={allSpots}
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
