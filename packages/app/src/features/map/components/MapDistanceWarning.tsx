import { Text } from '@app/shared/components'
import { createThemedStyles, Theme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { View } from 'react-native'
import { useDeviceBoundaryStatus } from '../stores/mapStore'

/**
 * Displays a warning badge when user is outside the trail boundary
 * Shows distance to nearest trail edge
 */
function MapDistanceWarning() {
  const { styles } = useApp(useStyles)
  const { isOutsideBoundary, distanceFromBoundary } = useDeviceBoundaryStatus()

  if (!isOutsideBoundary) {
    return null
  }

  const formattedDistance = formatDistance(distanceFromBoundary)

  return (
    <View style={styles!.container}>
      <View style={styles!.badge}>
        <View style={styles!.textContainer}>
          <Text variant='caption'  >Außerhalb des Trails</Text>
          <Text variant='caption'>{formattedDistance} entfernt</Text>
        </View>
      </View>
    </View>
  )
}

/**
 * Format distance in meters to human readable string
 * @param meters Distance in meters
 * @returns Formatted string (e.g. "150 m" or "2.3 km")
 */
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

const useStyles = createThemedStyles((theme: Theme) => ({
  container: {
    position: 'absolute' as const,
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center' as const,
    zIndex: 200,
    pointerEvents: 'none' as const,
  },
  badge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.deriveColor(theme.colors.error, 0.95),
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  textContainer: {
    flexDirection: 'column' as const,
  },
}))

export default MapDistanceWarning
