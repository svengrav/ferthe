import { useDiscoverySpots } from '@app/features/discovery/stores/discoveryTrailStore'
import { Text } from '@app/shared/components'
import { DiscoverySpot } from '@shared/contracts'
import { GeoBoundary } from '@shared/geo'
import { memo, useMemo } from 'react'
import { Image, Pressable, View } from 'react-native'
import { useSetTappedSpot } from '../../stores/mapStore'
import { useMapTheme } from '../../stores/mapThemeStore'
import { mapUtils } from '../../utils/geoToScreenTransform'

const DEFAULT_SPOT_SIZE = 15
const DEFAULT_SPOT_HEIGHT_OFFSET = 7
const DEFAULT_SPOT_COLOR = '#ffffff'
const MARKER_BORDER_RADIUS = 4
const IMAGE_BORDER_RADIUS = 2
const BORDER_WIDTH = 0.5
const BACKGROUND_COLOR = '#000000ff'
const IMAGE_BACKGROUND_COLOR = '#000'
const OFFSET_X = 10
const OFFSET_Y = 13.5
const FIRST_LETTER_INDEX = 0
const FIRST_LETTER_LENGTH = 1

interface MapSpotsProps {
  boundary: GeoBoundary
  size: { width: number; height: number }
  scale: number
}

/**
 * Component that renders spot markers on the map with images or initials
 * Props-based: boundary and size determine positioning
 */
function MapSpots({ boundary, size, scale }: MapSpotsProps) {
  const mapTheme = useMapTheme()
  const spots = useDiscoverySpots()
  const setTappedSpot = useSetTappedSpot()

  // Use the scale directly (it's already compensated from MapOverlay)
  const compensatedScale = scale

  // Pre-calculate all spot positions
  // Memoized: only recalc when boundary or size changes
  const spotPositions = useMemo(() => {
    return spots.map(spot => ({
      spot,
      position: mapUtils.coordinatesToPosition(
        spot.location,
        boundary,
        size
      )
    }))
  }, [spots, boundary, size.width, size.height])

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

  // Render spot marker at pre-calculated position
  const renderSpotMarker = ({ spot, position }: { spot: DiscoverySpot; position: { x: number; y: number } }, index: number) => {
    const spotSize = mapTheme.spot.size || DEFAULT_SPOT_SIZE
    const spotColor = mapTheme.spot.fill || DEFAULT_SPOT_COLOR
    const spotInitial = spot.name.substring(FIRST_LETTER_INDEX, FIRST_LETTER_LENGTH)

    return (
      <Pressable
        onPress={() => setTappedSpot(spot)}
        key={spot.id || index}
        style={{
          position: 'absolute',
          left: position.x - OFFSET_X,
          top: position.y - OFFSET_Y,
          zIndex: 99,
          transform: [{ scale: compensatedScale || 1 }]
        }}
      >
        <View style={[createMarkerContainerStyle(spotSize)]}>
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
      </Pressable>
    )
  }

  return (
    <>
      {spotPositions.map(renderSpotMarker)}
    </>
  )
}

export default memo(MapSpots)
