import { View } from 'react-native'
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'

import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { GeoBoundary } from '@shared/geo'
import { useOverlayCompensatedScale } from '../hooks/useOverlayCompensatedScale'
import { useOverlayGestures } from '../hooks/useOverlayGestures'
import { useMapContainerSize, useMapSurfaceBoundary } from '../stores/mapStore'
import MapClues from './surface/MapClues'
import MapDeviceMarker from './surface/MapDeviceMarker'
import MapSpots from './surface/MapSpots'
import MapTrailPath from './surface/MapTrailPath'

const DEFAULT_CANVAS_SIZE = 800
const MAX_CANVAS_DIMENSION = 1000
const CANVAS_MARGIN = 100

/**
 * Overlay component for Overview mode
 * Displays full trail with zoom/pan gestures
 */
function MapOverlay() {
  const { styles } = useApp(useStyles)
  const trailBoundary = useMapSurfaceBoundary()
  const screenSize = useMapContainerSize()

  const canvasSize = calculateCanvasSize(trailBoundary, screenSize)

  // Setup compensated scale for child elements
  const { compensatedScale, onScaleChange } = useOverlayCompensatedScale({
    canvasSize,
    screenSize,
  })

  // Setup gestures with scale callback
  const { gesture, animatedStyle, containerRef } = useOverlayGestures({
    canvasSize,
    screenSize,
    onScaleChange,
  })

  const dynamicSurfaceStyle = {
    width: canvasSize.width,
    height: canvasSize.height,
  }

  return (
    <View style={styles?.container} ref={containerRef}>
      <GestureHandlerRootView style={styles?.gestureContainer}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles?.mapSurface, dynamicSurfaceStyle, animatedStyle]}>
            <MapTrailPath boundary={trailBoundary} size={canvasSize} scale={compensatedScale} />
            <MapClues boundary={trailBoundary} size={canvasSize} scale={compensatedScale} />
            <MapSpots boundary={trailBoundary} size={canvasSize} scale={compensatedScale} />
            <MapDeviceMarker mode="overview" canvasSize={canvasSize} boundary={trailBoundary} scale={compensatedScale} />
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </View>
  )
}

// Calculate canvas size from trail boundary with Mercator projection correction
const calculateCanvasSize = (boundary: GeoBoundary, screenSize: { width: number; height: number }) => {
  const latSpan = Math.abs(boundary.northEast.lat - boundary.southWest.lat)
  const lonSpan = Math.abs(boundary.northEast.lon - boundary.southWest.lon)

  if (latSpan === 0 || lonSpan === 0) {
    return { width: DEFAULT_CANVAS_SIZE, height: DEFAULT_CANVAS_SIZE }
  }

  // Mercator projection correction
  const centerLat = (boundary.northEast.lat + boundary.southWest.lat) / 2
  const latRadians = centerLat * (Math.PI / 180)
  const correctedLonSpan = lonSpan * Math.cos(latRadians)

  const aspectRatio = correctedLonSpan / latSpan
  const availableWidth = screenSize.width - CANVAS_MARGIN
  const availableHeight = screenSize.height - CANVAS_MARGIN

  if (aspectRatio > 1) {
    const canvasWidth = Math.min(availableWidth, MAX_CANVAS_DIMENSION)
    return { width: canvasWidth, height: canvasWidth / aspectRatio }
  } else {
    const canvasHeight = Math.min(availableHeight, MAX_CANVAS_DIMENSION)
    return { width: canvasHeight * aspectRatio, height: canvasHeight }
  }
}

const useStyles = createThemedStyles(theme => ({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.deriveColor(theme.colors.background, 0.95),
    zIndex: 100,
  },
  gestureContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapSurface: {
    backgroundColor: theme.deriveColor(theme.colors.surface, 0.3),
    borderRadius: 12,
    position: 'relative',
  },
}))

export default MapOverlay
