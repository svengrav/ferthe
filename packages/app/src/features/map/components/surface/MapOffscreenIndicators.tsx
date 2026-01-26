import { memo, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useMapBoundary, useMapCanvas, useMapDevice, useMapFollowMode, useMapPanOffset, useMapSpots } from '../../stores/mapStore'
import { useMapTheme } from '../../stores/mapThemeStore'
import { mapUtils } from '../../utils/geoToScreenTransform.'
import { getMapService } from '../../utils/mapService'

const INDICATOR_SIZE = 24
const INDICATOR_MARGIN = 8
const MIN_DISTANCE_FOR_INDICATOR = 50 // pixels - only show indicator if spot is significantly offscreen

interface OffscreenSpot {
  id: string
  angle: number // Angle from center in radians
  distance: number // Distance in pixels from visible area
  count: number // Number of spots in this direction (for clustering)
}

/**
 * Calculates which spots are outside the visible canvas area
 * and returns their direction angles for indicator placement
 */
function calculateOffscreenSpots(
  spots: { id: string; location: { lat: number; lon: number } }[],
  boundary: { northEast: { lat: number; lon: number }; southWest: { lat: number; lon: number } },
  canvasSize: { width: number; height: number },
  userCenterOffset: { x: number; y: number },
  scale: number
): OffscreenSpot[] {
  const offscreen: OffscreenSpot[] = []
  const centerX = canvasSize.width / 2
  const centerY = canvasSize.height / 2

  // Visible area bounds (accounting for pan offset and scale)
  const visibleLeft = -userCenterOffset.x / scale
  const visibleRight = (canvasSize.width - userCenterOffset.x) / scale
  const visibleTop = -userCenterOffset.y / scale
  const visibleBottom = (canvasSize.height - userCenterOffset.y) / scale

  for (const spot of spots) {
    const screenPos = mapUtils.coordinatesToPosition(spot.location, boundary, canvasSize)

    // Check if spot is outside visible area
    const isOffscreen =
      screenPos.x < visibleLeft - MIN_DISTANCE_FOR_INDICATOR ||
      screenPos.x > visibleRight + MIN_DISTANCE_FOR_INDICATOR ||
      screenPos.y < visibleTop - MIN_DISTANCE_FOR_INDICATOR ||
      screenPos.y > visibleBottom + MIN_DISTANCE_FOR_INDICATOR

    if (isOffscreen) {
      // Calculate angle from canvas center to spot
      const dx = screenPos.x - centerX
      const dy = screenPos.y - centerY
      const angle = Math.atan2(dy, dx)
      const distance = Math.sqrt(dx * dx + dy * dy)

      offscreen.push({
        id: spot.id,
        angle,
        distance,
        count: 1,
      })
    }
  }

  return offscreen
}

/**
 * Groups nearby offscreen spots into clusters by angle
 */
function clusterOffscreenSpots(spots: OffscreenSpot[], angleThreshold = Math.PI / 8): OffscreenSpot[] {
  if (spots.length === 0) return []

  const sorted = [...spots].sort((a, b) => a.angle - b.angle)
  const clusters: OffscreenSpot[] = []
  let currentCluster = { ...sorted[0] }

  for (let i = 1; i < sorted.length; i++) {
    const spot = sorted[i]
    const angleDiff = Math.abs(spot.angle - currentCluster.angle)

    if (angleDiff < angleThreshold) {
      // Merge into current cluster
      currentCluster.count += 1
      currentCluster.distance = Math.min(currentCluster.distance, spot.distance)
    } else {
      // Start new cluster
      clusters.push(currentCluster)
      currentCluster = { ...spot }
    }
  }
  clusters.push(currentCluster)

  return clusters
}

/**
 * Calculates indicator position at canvas edge based on angle
 */
function calculateIndicatorPosition(
  angle: number,
  canvasSize: { width: number; height: number }
): { x: number; y: number; rotation: number } {
  const centerX = canvasSize.width / 2
  const centerY = canvasSize.height / 2
  const margin = INDICATOR_MARGIN + INDICATOR_SIZE / 2

  // Calculate intersection with canvas edge
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  // Check intersection with each edge
  const maxX = centerX - margin
  const maxY = centerY - margin

  let x: number, y: number

  // Determine which edge the angle points to
  const tanAngle = Math.abs(sin / cos)
  const edgeRatio = maxY / maxX

  if (tanAngle < edgeRatio) {
    // Hits left or right edge
    x = cos > 0 ? centerX + maxX : centerX - maxX
    y = centerY + (cos > 0 ? maxX : -maxX) * sin / Math.abs(cos)
  } else {
    // Hits top or bottom edge
    y = sin > 0 ? centerY + maxY : centerY - maxY
    x = centerX + (sin > 0 ? maxY : -maxY) * cos / Math.abs(sin)
  }

  // Clamp to canvas bounds
  x = Math.max(margin, Math.min(canvasSize.width - margin, x))
  y = Math.max(margin, Math.min(canvasSize.height - margin, y))

  // Rotation for arrow pointing outward
  const rotation = (angle * 180) / Math.PI + 90

  return { x, y, rotation }
}

/**
 * Single offscreen indicator arrow
 */
function OffscreenIndicator({
  angle,
  count,
  canvasSize,
  color,
}: {
  angle: number
  count: number
  canvasSize: { width: number; height: number }
  color: string
}) {
  const { x, y, rotation } = calculateIndicatorPosition(angle, canvasSize)

  return (
    <View
      style={[
        styles.indicator,
        {
          left: x - INDICATOR_SIZE / 2,
          top: y - INDICATOR_SIZE / 2,
          transform: [{ rotate: `${rotation}deg` }],
          backgroundColor: color,
        },
      ]}
    >
      {count > 1 && (
        <View style={styles.countBadge}>
          <View style={[styles.countText, { backgroundColor: color }]} />
        </View>
      )}
    </View>
  )
}

/**
 * Renders directional indicators for spots outside the visible canvas area
 */
function MapOffscreenIndicators() {
  const spots = useMapSpots()
  const boundary = useMapBoundary()
  const canvas = useMapCanvas()
  const device = useMapDevice()
  const followMode = useMapFollowMode()
  const panOffset = useMapPanOffset()
  const mapTheme = useMapTheme()
  const { calculateUserCenteredOffset } = getMapService()

  const userCenterOffset = useMemo(() => {
    if (!followMode) return panOffset
    return calculateUserCenteredOffset(device.location, boundary, canvas.size)
  }, [followMode, device.location, boundary, canvas.size, panOffset, calculateUserCenteredOffset])

  const clusteredIndicators = useMemo(() => {
    const offscreen = calculateOffscreenSpots(
      spots,
      boundary,
      canvas.size,
      userCenterOffset,
      1 // scale factor - simplified for now
    )
    return clusterOffscreenSpots(offscreen)
  }, [spots, boundary, canvas.size, userCenterOffset])

  if (clusteredIndicators.length === 0) return null

  const indicatorColor = mapTheme.spot?.fill || '#4A90D9'

  return (
    <View style={styles.container} pointerEvents="none">
      {clusteredIndicators.map((indicator, index) => (
        <OffscreenIndicator
          key={`offscreen-${index}`}
          angle={indicator.angle}
          count={indicator.count}
          canvasSize={canvas.size}
          color={indicatorColor}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  indicator: {
    position: 'absolute',
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    opacity: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    // Arrow shape using borders
    borderTopWidth: INDICATOR_SIZE * 0.6,
    borderLeftWidth: INDICATOR_SIZE * 0.3,
    borderRightWidth: INDICATOR_SIZE * 0.3,
    borderBottomWidth: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'currentColor',
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
})

export default memo(MapOffscreenIndicators)
