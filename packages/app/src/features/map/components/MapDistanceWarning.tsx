import { useDiscoveryTrail } from '@app/features/discovery'
import { getTrail, getTrailCenter } from '@app/features/trail'
import { Button, Text } from '@app/shared/components'
import { useExternalMap } from '@app/shared/hooks'
import { useLocalization } from '@app/shared/localization'
import { Theme, useTheme } from '@app/shared/theme'
import { Pressable, StyleSheet, View } from 'react-native'
import { useDeviceBoundaryStatus } from '../stores/mapStore'

/**
 * Format distance in meters to human readable string
 */
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

/**
 * Displays a warning badge when user is outside the trail boundary.
 * Shows distance to nearest trail edge.
 */
function MapDistanceWarning() {
  const { styles } = useTheme(createStyles)
  const { locales } = useLocalization()
  const { isOutsideBoundary, distanceFromBoundary, closestBoundaryPoint } = useDeviceBoundaryStatus()
  const { } = useExternalMap()

  const { trailId } = useDiscoveryTrail()
  const { openMap } = useExternalMap(getTrailCenter(getTrail(trailId ?? '')))

  if (!isOutsideBoundary) {
    return null
  }

  const formattedDistance = formatDistance(distanceFromBoundary)

  return (
    <View style={styles.container} id="map-distance-warning">
      <Pressable style={styles.badge} onPress={() => openMap()}>
        <Button dense icon='pin-drop' />
        <View style={styles.textContainer}>
          <Text variant='caption'>{locales.map.outsideTrail}</Text>
          <Text variant='caption'>{formattedDistance} {locales.map.distanceAway} (tap)</Text>
        </View>
      </Pressable>
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
    pointerEvents: 'none',
  },
  badge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    minWidth: 150,
    backgroundColor: theme.colors.dark,
    paddingVertical: theme.tokens.inset.sm,
    paddingHorizontal: theme.tokens.inset.lg,
    borderRadius: theme.tokens.borderRadius.md,
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default MapDistanceWarning
