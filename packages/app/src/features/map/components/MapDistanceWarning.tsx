import { Text } from '@app/shared/components'
import { Theme, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { StyleSheet, View } from 'react-native'
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
  const { locales } = useApp()
  const { isOutsideBoundary, distanceFromBoundary } = useDeviceBoundaryStatus()

  if (!isOutsideBoundary) {
    return null
  }

  const formattedDistance = formatDistance(distanceFromBoundary)

  return (
    <View style={styles.container} id="map-distance-warning">
      <View style={styles.badge}>
        <View style={styles.textContainer}>
          <Text variant='caption'>{locales.map.outsideTrail}</Text>
          <Text variant='caption'>{formattedDistance} {locales.map.distanceAway}</Text>
        </View>
      </View>
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
    minWidth: 150,
    backgroundColor: theme.colors.black,
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
