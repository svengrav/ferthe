import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { GeoBoundary } from '@shared/geo'
import { memo } from 'react'
import { View } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import Svg, { Circle, Polygon } from 'react-native-svg'
import { useMapDevice } from '../../stores/mapStore'
import { useMapTheme } from '../../stores/mapThemeStore'
import { mapUtils } from '../../utils/geoToScreenTransform'
import { useCompensatedScale } from './MapViewport'

// Arrow SVG constants
const SVG_VIEWBOX = '0 0 18 18'
const CIRCLE_CENTER = 9
const CIRCLE_RADIUS = 8
const ARROW_POINTS = '13.38 13.1 4.62 13.1 9 3 13.38 13.1'

// Marker size constants
const ARROW_SIZE = 18
const MARKER_SIZE = 50
const MARKER_BORDER_RADIUS = 25

// Default colors
const DEFAULT_FILL_COLOR = 'rgba(255, 255, 255, 1)'
const CIRCLE_BACKGROUND = '#4e4e4e48'

interface ArrowProps {
  rotation?: number
  fill?: string
}


/**
 * Arrow component for displaying directional indicator with rotation
 */
function Arrow({ rotation = 0, fill }: ArrowProps) {
  const { styles } = useApp(useArrowStyles)

  if (!styles) return null

  return (
    <View style={[styles.arrow, { transform: [{ rotate: `${rotation}deg` }] }]}>
      <Svg viewBox={SVG_VIEWBOX}>
        <Circle
          cx={CIRCLE_CENTER}
          cy={CIRCLE_CENTER}
          r={CIRCLE_RADIUS}
          fill={CIRCLE_BACKGROUND}
          stroke={fill}
          strokeWidth={1.5}
        />
        <Polygon fill={fill} points={ARROW_POINTS} />
      </Svg>
    </View>
  )
}

interface MapDeviceMarkerProps {
  mode: 'canvas' | 'overview'
  canvasSize: { width: number; height: number }
  boundary?: GeoBoundary
}

/**
 * Map device marker component that displays the user's location and heading on the map
 * Canvas mode: Fixed at canvas center - map moves around device
 * Overview mode: Positioned by device location within trail boundary
 */
function MapDeviceMarker({ mode, canvasSize, boundary }: MapDeviceMarkerProps) {
  const { styles } = useApp(useMarkerStyles)
  const device = useMapDevice()
  const mapTheme = useMapTheme()
  const scale = useCompensatedScale()

  const fillColor = mapTheme.device.fill || DEFAULT_FILL_COLOR

  // Create animated style for scale (if provided)
  const scaleStyle = useAnimatedStyle(() => {
    if (!scale) return {}
    return { transform: [{ scale: scale.value }] }
  }, [scale])

  let position: { left: number; top: number }

  if (mode === 'canvas') {
    // Canvas mode: Device is always centered
    position = {
      left: canvasSize.width / 2,
      top: canvasSize.height / 2,
    }
  } else {
    // Overview mode: Calculate position from device location
    if (!boundary) {
      return null
    }
    const screenPos = mapUtils.coordinatesToPosition(device.location, boundary, canvasSize)
    position = {
      left: screenPos.x,
      top: screenPos.y,
    }
  }

  return (
    <Animated.View style={[styles!.marker, position, scaleStyle]}>
      <Arrow rotation={device.heading} fill={fillColor} />
    </Animated.View>
  )
}

const useArrowStyles = createThemedStyles(() => ({
  arrow: {
    width: ARROW_SIZE,
    height: ARROW_SIZE,
  },
}))

const useMarkerStyles = createThemedStyles(() => ({
  marker: {
    position: 'absolute',
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    marginLeft: -MARKER_SIZE / 2,
    marginTop: -MARKER_SIZE / 2,
  },
}))

export { Arrow }
export default memo(MapDeviceMarker)
