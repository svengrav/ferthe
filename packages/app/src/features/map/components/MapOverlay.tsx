import { View } from 'react-native'
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'

import { Image } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { GeoBoundary } from '@shared/geo'
import { useOverlayGestures } from '../hooks/useOverlayGestures'
import { getMapStoreActions, useMapContainerSize, useMapOverlay, useMapSurfaceBoundary } from '../stores/mapStore'
import { mapUtils } from '../utils/geoToScreenTransform'
import MapClues from './surface/MapClues'
import MapDeviceMarker from './surface/MapDeviceMarker'
import MapSpots from './surface/MapSpots'
import MapTrailPath from './surface/MapTrailPath'
import { CompensatedScaleProvider } from './surface/MapViewport'

const DEFAULT_CANVAS_SIZE = 800
const MAX_CANVAS_DIMENSION = 1000
const CANVAS_MARGIN = 20
const MAX_ZOOM_METERS = 50
const OVERVIEW_IMAGE_OPACITY = 0.7

/**
 * Overlay component for Overview mode
 * Displays full trail with zoom/pan gestures
 */
function MapOverlay() {
  const { styles } = useApp(useStyles)
  const trailBoundary = useMapSurfaceBoundary()
  const screenSize = useMapContainerSize()
  const overlay = useMapOverlay()
  const { setOverlay } = getMapStoreActions()

  const canvasSize = calculateCanvasSize(trailBoundary, screenSize)
  const zoomLimits = mapUtils.calculateOverlayZoomLimits(
    trailBoundary,
    canvasSize,
    screenSize,
    MAX_ZOOM_METERS
  )

  // Calculate initial scale: 
  // - Use stored value if user has zoomed (differs from min scale)
  // - Otherwise fit entire trail to screen (zoomLimits.min)
  // - Clamp to valid range in case trail boundaries changed
  const storedScale = overlay.scale.init
  const hasUserZoomed = Math.abs(storedScale - zoomLimits.min) > 0.01
  const unclamped = hasUserZoomed ? storedScale : zoomLimits.min
  const initialScale = Math.max(zoomLimits.min, Math.min(zoomLimits.max, unclamped))

  // Persist zoom/pan state to store
  const handleGestureEnd = (scale: number, offsetX: number, offsetY: number) => {
    setOverlay({
      scale: { ...overlay.scale, init: scale, min: zoomLimits.min, max: zoomLimits.max },
      offset: { x: offsetX, y: offsetY },
    })
  }

  // Setup gestures with calculated zoom limits and compensated scale
  const { gesture, animatedStyle, containerRef, compensatedScale } = useOverlayGestures({
    canvasSize,
    screenSize,
    zoomLimits,
    initialScale,
    initialOffset: overlay.offset,
    onGestureEnd: handleGestureEnd,
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
            {/* Trail overview background image */}
            {overlay.image && (
              <View style={styles?.backgroundContainer}>
                <Image
                  source={{ uri: overlay.image }}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  style={styles?.backgroundImage}
                  showLoader={false}
                />
              </View>
            )}

            <CompensatedScaleProvider value={compensatedScale}>
              <MapTrailPath boundary={trailBoundary} size={canvasSize} />
              <MapClues boundary={trailBoundary} size={canvasSize} />
              <MapSpots boundary={trailBoundary} size={canvasSize} />
              <MapDeviceMarker mode="overview" canvasSize={canvasSize} boundary={trailBoundary} />
            </CompensatedScaleProvider>
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

  // Calculate canvas size that fits within available space while maintaining aspect ratio
  let canvasWidth: number
  let canvasHeight: number

  if (aspectRatio > 1) {
    // Trail is wider - fit to width first
    canvasWidth = Math.min(availableWidth, MAX_CANVAS_DIMENSION)
    canvasHeight = canvasWidth / aspectRatio
    // Check if height exceeds available space
    if (canvasHeight > availableHeight) {
      canvasHeight = availableHeight
      canvasWidth = canvasHeight * aspectRatio
    }
  } else {
    // Trail is taller - fit to height first
    canvasHeight = Math.min(availableHeight, MAX_CANVAS_DIMENSION)
    canvasWidth = canvasHeight * aspectRatio
    // Check if width exceeds available space
    if (canvasWidth > availableWidth) {
      canvasWidth = availableWidth
      canvasHeight = canvasWidth / aspectRatio
    }
  }

  return { width: canvasWidth, height: canvasHeight }
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
    overflow: 'hidden',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundImage: {
    opacity: OVERVIEW_IMAGE_OPACITY,
  },
}))

export default MapOverlay
