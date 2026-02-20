import { GeoBoundary } from '@shared/geo'
import { memo } from 'react'
import { View } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import Svg, { Circle, Polygon } from 'react-native-svg'
import { useMapDevice } from '../../stores/mapStore'
import { useMapTheme } from '../../stores/mapThemeStore'
import { mapUtils } from '../../services/geoToScreenTransform'
import { useMapCompensatedScale } from './MapCompensatedScale'

// Arrow SVG constants (geometry)
const SVG_VIEWBOX = '0 0 18 18'
const CIRCLE_CENTER = 9
const CIRCLE_RADIUS = 8
const ARROW_POINTS = '13.38 13.1 4.62 13.1 9 3 13.38 13.1'

interface ArrowProps {
  rotation?: number
  fill?: string
  strokeColor?: string
  circleBackground?: string
  size?: number
}


/**
 * Arrow component for displaying directional indicator with rotation
 */
function Arrow({ rotation = 0, fill, strokeColor, circleBackground, size = 18 }: ArrowProps) {
  const animatedStyle = {
    width: size,
    height: size,
    transform: [{ rotate: `${rotation}deg` }],
  }

  return (
    <View style={animatedStyle}>
      <Svg viewBox={SVG_VIEWBOX}>
        <Circle
          cx={CIRCLE_CENTER}
          cy={CIRCLE_CENTER}
          r={CIRCLE_RADIUS}
          fill={circleBackground}
          stroke={strokeColor}
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
  const device = useMapDevice()
  const mapTheme = useMapTheme()
  const scale = useMapCompensatedScale()

  const {
    fill: fillColor,
    strokeColor,
    circleBackground,
    arrowSize,
    markerSize,
    markerBorderRadius,
  } = mapTheme.device

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
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: markerSize,
          height: markerSize,
          borderRadius: markerBorderRadius,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          marginLeft: -markerSize / 2,
          marginTop: -markerSize / 2,
        },
        position,
        scaleStyle,
      ]}
    >
      <Arrow
        rotation={device.heading}
        fill={fillColor}
        strokeColor={strokeColor}
        circleBackground={circleBackground}
        size={arrowSize}
      />
    </Animated.View>
  )
}

export { Arrow }
export default memo(MapDeviceMarker)
