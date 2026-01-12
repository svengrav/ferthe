import { GeoBoundary, GeoLocation } from '@shared/geo'
import { StyleProp, View, ViewStyle } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { JSX } from 'react/jsx-runtime'
import { mapUtils } from '../../utils/geoToScreenTransform.'

const DEFAULT_STROKE_COLOR = '#3498db'

/**
 * Generates an SVG path data string from an array of geographic coordinates
 * @param points Array of geographic coordinates
 * @param geoBoundary Current map boundaries
 * @returns SVG path data string (d attribute)
 */
const generatePathFromGeoPoints = (points: GeoLocation[], boundary: GeoBoundary, size: { width: number; height: number }): string => {
  if (!points || points.length === 0) return ''

  const firstPoint = mapUtils.coordinatesToPosition(points[0], boundary, size)
  let pathData = `M ${firstPoint.x} ${firstPoint.y}`

  for (let i = 1; i < points.length; i++) {
    const screenPoint = mapUtils.coordinatesToPosition(points[i], boundary, size)
    pathData += ` L ${screenPoint.x} ${screenPoint.y}`
  }

  return pathData
}

interface GeoPathProps {
  points: GeoLocation[]
  boundary: GeoBoundary
  size: { width: number; height: number }
  scale?: number
  closed?: boolean
  style?: {
    strokeColor?: string
    strokeWidth?: number
    strokeDash?: number[]
    fill?: string
    [key: string]: any // Allow any style properties
  }
}

/**
 * Component that renders an SVG path from geographic coordinates
 */
export const GeoPath = ({
  points,
  boundary,
  size,
  scale = 1,
  closed = false,
  style = {
    strokeColor: DEFAULT_STROKE_COLOR,
    strokeWidth: 2,
    strokeDash: [],
  },
}: GeoPathProps): JSX.Element | null => {
  if (!points || points.length < 2) return null
  let pathData = generatePathFromGeoPoints(points, boundary, size)

  // If the path should be closed, add a Z command
  if (closed) {
    pathData += ' Z'
  }
  return (
    <Svg width='100%' height='100%' style={[{ position: 'absolute' }]}>
      <Path d={pathData} stroke={style.strokeColor} strokeWidth={(style.strokeWidth || 1) * scale} strokeDasharray={style.strokeDash} fill={'none'} />
    </Svg>
  )
}

interface GeoMarkerProps {
  location: GeoLocation
  radius: number
  boundary: GeoBoundary,
  size: { width: number; height: number }
  style?: {
    fill?: string
    strokeColor?: string
    strokeWidth?: number
  }
}

/**
 * Component that renders a View marker at a geographic location
 */
export const GeoMarker = ({
  location,
  radius,
  size,
  style,
  boundary
}: GeoMarkerProps) => {
  const point = mapUtils.coordinatesToPosition(location, boundary, size)

  let finalRadius: number

  const radiusInPixels = mapUtils.metersToPixels(location, boundary, radius, size.width)
  finalRadius = Math.max(radiusInPixels, 5)

  return (
    <View
      style={[
        {
          position: 'absolute',
          left: point.x - finalRadius,
          top: point.y - finalRadius,
          width: finalRadius * 2,
          height: finalRadius * 2,
          borderRadius: finalRadius,
          backgroundColor: style?.fill || '#3b3b3b41',
          borderWidth: style?.strokeWidth || 1,
          borderColor: style?.strokeColor || 'white',
        },
      ]}
    />
  )
}


/**
 * Container component that positions its children at geographic coordinates
 */
interface GeoPositionerProps {
  location: GeoLocation
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  boundary: GeoBoundary
  size: { width: number; height: number }
  offsetX?: number
  offsetY?: number
}

export const GeoPositioner = ({
  location,
  children,
  style,
  offsetX = 0,
  offsetY = 0,
  boundary,
  size,
}: GeoPositionerProps) => {
  const point = mapUtils.coordinatesToPosition(location, boundary, size)
  return (
    <View
      style={[
        {
          position: 'absolute',
          left: point.x,
          top: point.y,
          zIndex: 99,
          transform: [{ translateX: -offsetX }, { translateY: -offsetY }],
        },
        style,
      ]}>
      {children}
    </View>
  )
}
