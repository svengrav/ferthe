import { useDiscoveries } from '@app/features/discovery'
import { spotStore } from '@app/features/spot/stores/spotStore'
import { geoUtils } from '@shared/geo'
import { memo, useMemo } from 'react'
import { View } from 'react-native'
import { useShallow } from 'zustand/react/shallow'
import { mapUtils } from '../../services/geoToScreenTransform'
import { useDeviceBoundaryStatus, useMapCanvasBoundary, useMapContainerSize, useMapDevice } from '../../stores/mapStore'
import { useMapTheme } from '../../stores/mapThemeStore'

const DOT_SIZE = 8
const MAX_DISCOVERIES = 5

/**
 * Renders border indicators for the latest 5 off-screen Discoveries.
 * Visible when user is outside the trail boundary or no discoveries are in the current viewport.
 */
function MapDiscoveryBorderIndicators() {
  const { isOutsideBoundary } = useDeviceBoundaryStatus()
  const canvasBoundary = useMapCanvasBoundary()
  const containerSize = useMapContainerSize()
  const device = useMapDevice()
  const discoveries = useDiscoveries()
  const spotsById = spotStore(useShallow(state => state.byId))
  const mapTheme = useMapTheme()

  const { shouldShow, indicators } = useMemo(() => {
    if (!device.location) return { shouldShow: false, indicators: [] }

    const sorted = [...discoveries]
      .filter(d => d.discoveredAt)
      .sort((a, b) => new Date(b.discoveredAt!).getTime() - new Date(a.discoveredAt!).getTime())
      .slice(0, MAX_DISCOVERIES)

    const inViewCount = sorted.filter(d => {
      const spot = spotsById[d.spotId]
      return spot && geoUtils.isCoordinateInBounds(spot.location, canvasBoundary)
    }).length

    const show = isOutsideBoundary || inViewCount === 0

    const offScreenIndicators = sorted
      .map(d => {
        const spot = spotsById[d.spotId]
        if (!spot) return null
        const inView = geoUtils.isCoordinateInBounds(spot.location, canvasBoundary)
        if (inView) return null
        const bearing = geoUtils.calculateBearing(device.location!, spot.location)
        return { id: d.id, pos: mapUtils.projectBearingToBorder(bearing, containerSize) }
      })
      .filter(Boolean) as Array<{ id: string; pos: { x: number; y: number } }>

    return { shouldShow: show, indicators: offScreenIndicators }
  }, [discoveries, spotsById, canvasBoundary, containerSize, device.location, isOutsideBoundary])

  if (!shouldShow || indicators.length === 0) return null

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', width: containerSize.width, height: containerSize.height, zIndex: 49 }}
    >
      {indicators.map(({ id, pos }) => (
        <View
          key={id}
          style={{
            position: 'absolute',
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: DOT_SIZE / 2,
            backgroundColor: mapTheme.discovery.fill,
            borderColor: '#00000066',
            borderWidth: 1,
            left: pos.x - DOT_SIZE / 2,
            top: pos.y - DOT_SIZE / 2,
          }}
        />
      ))}
    </View>
  )
}

export default memo(MapDiscoveryBorderIndicators)
