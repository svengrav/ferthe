import { Text } from '@app/shared/components'
import { Spot } from '@shared/contracts'
import { memo, useMemo } from 'react'
import { Image, View } from 'react-native'
import { useMapSpots, useMapSurfaceBoundary, useMapSurfaceLayout, useViewportScale } from '../../stores/mapStore'
import { useMapTheme } from '../../stores/mapThemeStore'
import { mapUtils } from '../../utils/geoToScreenTransform.'

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
 * Surface-centric: Positions calculated once relative to surface.boundary + surface.layout
 * Re-calc only when surface geometry changes, not on every render
 */
function MapSpots() {
  const viewportScale = useViewportScale()
  const compensatedScale = 1 / viewportScale
  const mapTheme = useMapTheme()
  const spots = useMapSpots()
  const surfaceLayout = useMapSurfaceLayout()
  const boundary = useMapSurfaceBoundary()

  // Pre-calculate all spot positions (surface-centric)
  // Memoized: only recalc when boundary or layout size changes, not on viewport transform
  const spotPositions = useMemo(() => {
    return spots.map(spot => ({
      spot,
      position: mapUtils.coordinatesToPosition(
        spot.location,
        boundary,
        { width: surfaceLayout.width, height: surfaceLayout.height }
      )
    }))
  }, [spots, boundary, surfaceLayout.width, surfaceLayout.height])

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
  const renderSpotMarker = ({ spot, position }: { spot: Spot; position: { x: number; y: number } }, index: number) => {
    const spotSize = mapTheme.spot.size || DEFAULT_SPOT_SIZE
    const spotColor = mapTheme.spot.fill || DEFAULT_SPOT_COLOR
    const spotInitial = spot.name.substring(FIRST_LETTER_INDEX, FIRST_LETTER_LENGTH)

    return (
      <View
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
      </View>
    )
  }

  return (
    <>
      {spotPositions.map(renderSpotMarker)}
    </>
  )
}

export default memo(MapSpots)
