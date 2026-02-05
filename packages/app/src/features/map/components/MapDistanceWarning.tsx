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
    zIndex: 200,
    pointerEvents: 'none',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.deriveColor(theme.colors.error, 0.95),
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default MapDistanceWarning
