import { useDiscoveryEventCardOverlay } from '@app/features/discovery/components/DiscoveryEventCard'
import { Image, Text } from '@app/shared/components'
import { GeoBoundary } from '@shared/geo'
import { memo, useMemo } from 'react'
import { Pressable, View } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { MapSpot, useMapSpotsViewModel } from '../../hooks/useMapSpotsViewModel'
import { mapUtils } from '../../services/geoToScreenTransform'
import { MapTheme, useMapTheme } from '../../stores/mapThemeStore'
import { useMapCompensatedScale } from './MapCompensatedScale'

// Pre-create style functions outside component for performance
const createMarkerContainerStyle = (theme: MapTheme) => ({
  borderRadius: theme.spot.borderRadius,
  width: theme.spot.size,
  height: theme.spot.size + theme.spot.heightOffset,
  borderWidth: theme.spot.borderWidth,
  backgroundColor: theme.spot.backgroundColor,
  overflow: 'hidden' as const,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
})

const createImageStyle = (theme: MapTheme) => ({
  width: '100%' as const,
  height: '100%' as const,
  borderRadius: theme.spot.imageBorderRadius,
  backgroundColor: theme.spot.imageBackgroundColor,
})

const createFallbackStyle = (theme: MapTheme) => ({
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  borderColor: theme.spot.fill,
})

interface MapSpotsProps {
  boundary: GeoBoundary
  size: { width: number; height: number }
}

/**
 * Component that renders spot markers on the map with images or initials.
 * Shows all spots from active trail (discovered + created + public).
 * Visual distinction: public spots have reduced opacity.
 * Props-based: boundary and size determine positioning
 */
function MapSpots({ boundary, size }: MapSpotsProps) {
  const theme = useMapTheme()
  const spots = useMapSpotsViewModel()
  const scale = useMapCompensatedScale()
  const { showDiscoveryEventCard } = useDiscoveryEventCardOverlay()

  // Create animated style for scale transform
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }), [scale])

  // Pre-calculate spot positions
  const spotPositions = useMemo(() => {
    return spots.map(spot => ({
      spot,
      position: mapUtils.coordinatesToPosition(spot.location, boundary, size),
      isPublic: spot.source === 'public', // Visual distinction for public spots
    }))
  }, [spots, boundary, size.width, size.height])

  // Pre-create styles based on theme
  const markerStyle = createMarkerContainerStyle(theme)
  const imageStyle = createImageStyle(theme)
  const fallbackStyle = createFallbackStyle(theme)

  // Render spot marker at pre-calculated position
  const renderSpotMarker = (
    { spot, position, isPublic }: { spot: MapSpot; position: { x: number; y: number }; isPublic: boolean },
    index: number
  ) => {
    const spotInitial = spot.name[0]

    return (
      <Animated.View
        key={spot.id || index}
        style={[
          {
            position: 'absolute',
            left: position.x - theme.spot.offsetX,
            top: position.y - theme.spot.offsetY,
            zIndex: isPublic ? 98 : 99, // Public spots slightly below discovered
            opacity: isPublic ? 0.7 : 1, // Visual distinction for public spots
          },
          scaleStyle
        ]}
      >
        <Pressable onPress={() => showDiscoveryEventCard(spot.id, { mode: 'instant' })}>
          <View style={markerStyle}>
            {spot.image?.url ? (
              <Image
                source={{ uri: spot.image.url }}
                style={imageStyle}
                resizeMode="cover"
                showLoader={false}
              />
            ) : (
              <View style={fallbackStyle}>
                <Text>{spotInitial}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    )
  }

  return (
    <>
      {spotPositions.map((data, index) => renderSpotMarker(data, index))}
    </>
  )
}

export default memo(MapSpots)
