import { useDiscoveryTrail } from '@app/features/discovery'
import { getTrail, getTrailCenter } from '@app/features/trail'
import { geoUtils } from '@shared/geo'
import { memo } from 'react'
import { View } from 'react-native'
import { mapUtils } from '../../services/geoToScreenTransform'
import { useDeviceBoundaryStatus, useMapContainerSize, useMapDevice } from '../../stores/mapStore'
import { useMapTheme } from '../../stores/mapThemeStore'

const DOT_SIZE = 12

/**
 * Renders a dot at the canvas border pointing toward the trail center
 * when the user is outside the trail boundary.
 */
function MapTrailBorderIndicator() {
  const { isOutsideBoundary } = useDeviceBoundaryStatus()
  const containerSize = useMapContainerSize()
  const device = useMapDevice()
  const { trailId } = useDiscoveryTrail()
  const mapTheme = useMapTheme()

  if (!isOutsideBoundary || !trailId || !device.location) return null

  const trail = getTrail(trailId)
  if (!trail) return null

  const trailCenter = getTrailCenter(trail)
  if (!trailCenter) return null  // stumble trails have no fixed boundary

  const bearing = geoUtils.calculateBearing(device.location, trailCenter)
  const pos = mapUtils.projectBearingToBorder(bearing, containerSize)

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', width: containerSize.width, height: containerSize.height, zIndex: 50 }}
    >
      <View
        style={{
          position: 'absolute',
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: mapTheme.trail.strokeColor,
          borderColor: '#ffffff',
          borderWidth: 1.5,
          left: pos.x - DOT_SIZE / 2,
          top: pos.y - DOT_SIZE / 2,
        }}
      />
    </View>
  )
}

export default memo(MapTrailBorderIndicator)
