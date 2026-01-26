import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { GeoBoundary, GeoLocation } from '@shared/geo/'
import { memo } from 'react'
import { View } from 'react-native'
import Svg, { Circle, Polygon } from 'react-native-svg'
import { useCompensatedScale, useMapBoundary, useMapCanvas, useMapDevice } from '../../stores/mapStore'
import { useMapTheme } from '../../stores/mapThemeStore'
import { mapUtils } from '../../utils/geoToScreenTransform.'

export interface MapDeviceMarkerProps {
  boundary?: GeoBoundary
  canvasSize?: { width: number; height: number }
  compensatedScale?: number
}

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

/**
 * Hook to calculate marker position and styles
 */
const useMarkerPosition = (location: GeoLocation, boundary: GeoBoundary, size: { width: number; height: number }) => {
  const mapPosition = mapUtils.coordinatesToPosition(location, boundary, size)

  const getMarkerPosition = () => ({
    left: mapPosition.x,
    top: mapPosition.y,
  })

  return { getMarkerPosition }
}

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

  const getArrowTransform = () => ({
    transformOrigin: 'center',
    transform: [{ rotate: `${rotation}deg` }],
  })

  return (
    <View style={[styles.arrow, getArrowTransform()]}>
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

/**
 * Map device marker component that displays the user's location and heading on the map
 * @param props.boundary - Optional boundary override (uses store if not provided)
 * @param props.canvasSize - Optional canvas size override (uses store if not provided)
 * @param props.compensatedScale - Optional scale override for marker size compensation
 */
function MapDeviceMarker({ boundary: propBoundary, canvasSize: propCanvasSize, compensatedScale: propScale }: MapDeviceMarkerProps = {}) {
  const { styles } = useApp(useMarkerStyles)
  const device = useMapDevice()
  const storeScale = useCompensatedScale()
  const canvas = useMapCanvas()
  const storeBoundary = useMapBoundary()

  // Use props if provided, otherwise fall back to store
  const boundary = propBoundary ?? storeBoundary
  const size = propCanvasSize ?? canvas.size
  const scale = propScale ?? storeScale

  const { getMarkerPosition } = useMarkerPosition(device.location, boundary, size)
  const marker = getMarkerPosition()
  const mapTheme = useMapTheme()

  const fillColor = mapTheme.device.fill || DEFAULT_FILL_COLOR

  return (
    <View style={[
      styles!.marker,
      marker,
      { transform: [{ scale: scale }] }
    ]}>
      <Arrow rotation={device.heading} fill={fillColor} />
    </View>
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
