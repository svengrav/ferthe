import { Text } from '@app/shared/components'
import { Spot } from '@shared/contracts'
import { GeoBoundary } from '@shared/geo'
import { memo } from 'react'
import { Image, View } from 'react-native'
import { useCompensatedScale, useMapBoundary, useMapCanvas, useMapSpots } from '../../stores/mapStore'
import { useMapTheme } from '../../stores/mapThemeStore'
import { GeoPositioner } from './MapElements'

export interface MapSpotsProps {
  boundary?: GeoBoundary
  canvasSize?: { width: number; height: number }
  compensatedScale?: number
}

const DEFAULT_SPOT_SIZE = 15
const DEFAULT_SPOT_HEIGHT_OFFSET = 7
const DEFAULT_SPOT_COLOR = '#ffffff'
const MARKER_BORDER_RADIUS = 4
const IMAGE_BORDER_RADIUS = 2
const BORDER_WIDTH = 0.5
const BACKGROUND_COLOR = '#000000ff'
const IMAGE_BACKGROUND_COLOR = '#000'
const OFFSET_X = 7
const OFFSET_Y = 11
const FIRST_LETTER_INDEX = 0
const FIRST_LETTER_LENGTH = 1

/**
 * Component that renders spot markers on the map with images or initials
 * @param props.boundary - Optional boundary override (uses store if not provided)
 * @param props.canvasSize - Optional canvas size override (uses store if not provided)
 * @param props.compensatedScale - Optional scale override for marker size compensation
 */
function MapSpots({ boundary: propBoundary, canvasSize: propCanvasSize, compensatedScale: propScale }: MapSpotsProps = {}) {
  const storeScale = useCompensatedScale()
  const mapTheme = useMapTheme()
  const { size: storeSize } = useMapCanvas()
  const storeBoundary = useMapBoundary()
  const spots = useMapSpots()

  // Use props if provided, otherwise fall back to store
  const boundary = propBoundary ?? storeBoundary
  const size = propCanvasSize ?? storeSize
  const scale = propScale ?? storeScale

  // Helper function to create marker container styles
  const createMarkerContainerStyle = (spotSize: number) => ({
    borderRadius: MARKER_BORDER_RADIUS,
    width: spotSize,
    height: spotSize + DEFAULT_SPOT_HEIGHT_OFFSET,
    borderWidth: BORDER_WIDTH,
    backgroundColor: BACKGROUND_COLOR,
    overflow: 'hidden' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  })

  // Helper function to create image styles
  const createImageStyle = () => ({
    width: '100%' as const,
    height: '100%' as const,
    borderRadius: IMAGE_BORDER_RADIUS,
    backgroundColor: IMAGE_BACKGROUND_COLOR,
  })

  // Helper function to create fallback text container styles
  const createFallbackTextStyle = (spotColor: string) => ({
    borderColor: spotColor,
  })

  // Helper function to render individual spot marker
  const renderSpotMarker = (spot: Spot, index: number) => {
    const spotSize = mapTheme.spot.size || DEFAULT_SPOT_SIZE
    const spotColor = mapTheme.spot.fill || DEFAULT_SPOT_COLOR
    const spotInitial = spot.name.substring(FIRST_LETTER_INDEX, FIRST_LETTER_LENGTH)

    return (
      <GeoPositioner
        key={spot.id || index}
        location={spot.location}
        boundary={boundary}
        size={size}
        offsetX={OFFSET_X}
        offsetY={OFFSET_Y}
      >
        <View style={[createMarkerContainerStyle(spotSize), { transform: [{ scale: scale }] }
        ]}>
          {spot.image?.url ? (
            <Image
              source={{ uri: spot.image.url }}
              style={createImageStyle()}
              resizeMode="cover"
            />
          ) : (
            <View style={createFallbackTextStyle(spotColor)}>
              <Text>{spotInitial}</Text>
            </View>
          )}
        </View>
      </GeoPositioner>
    )
  }

  return (
    <>
      {spots.map(renderSpotMarker)}
    </>
  )
}

export default memo(MapSpots)
