import { useState } from 'react'
import { View } from 'react-native'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

import { Theme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { useMapTrailBoundary, useMapViewport } from '../stores/mapStore'
import { mapService } from '../utils/mapService'
import MapLayerSwitch from './MapLayerSwitch'
import MapDeviceMarker from './surface/MapDeviceMarker'
import MapSpots from './surface/MapSpots'
import MapTrailPath from './surface/MapTrailPath'

// Zoom and pan limits for overview mode
const MIN_SCALE = 0.8
const MAX_SCALE = 1.5
const SCALE_RESISTANCE = 0.3
const PAN_RESISTANCE = 0.3
const EDGE_PADDING = 30 // Padding between canvas edge and viewport edge

/**
 * Overlay component for Overview mode
 * Uses trailBoundary (full trail) instead of clamped boundary
 * Reuses MapSpots, MapTrailPath, MapDeviceMarker with boundary override
 * Supports pinch-to-zoom and pan gestures
 */
export function MapOverlay() {
  const { theme } = useApp()
  const trailBoundary = useMapTrailBoundary()
  const viewport = useMapViewport()

  // Zoom state
  const scale = useSharedValue(1)
  const baseScale = useSharedValue(1)
  const [compensatedScale, setCompensatedScale] = useState(1)

  // Pan state
  const translationX = useSharedValue(0)
  const translationY = useSharedValue(0)
  const prevTranslationX = useSharedValue(0)
  const prevTranslationY = useSharedValue(0)

  // Calculate canvas size based on trail boundary aspect ratio
  const hasValidBoundary = trailBoundary.northEast.lat !== 0 || trailBoundary.southWest.lat !== 0
  const canvasSize = hasValidBoundary
    ? mapService.calculateCanvasSize(trailBoundary, 400)
    : { width: 350, height: 350 }

  const styles = createStyles(theme, canvasSize)

  // Calculate translation bounds based on current scale
  const calculateBounds = () => {
    'worklet'
    const scaledWidth = canvasSize.width * scale.value
    const scaledHeight = canvasSize.height * scale.value
    const maxTranslateX = scaledWidth > viewport.width ? (scaledWidth - viewport.width) / 2 + EDGE_PADDING : 0
    const maxTranslateY = scaledHeight > viewport.height ? (scaledHeight - viewport.height) / 2 + EDGE_PADDING : 0

    return {
      maxTranslateX: Math.max(0, maxTranslateX),
      maxTranslateY: Math.max(0, maxTranslateY),
    }
  }

  // Helper to update compensated scale from worklet
  const updateCompensatedScale = (zoomScale: number) => {
    const baseCompensation = (1 / zoomScale) * 1.2
    const dampening = 0.6
    const compensated = 1 + (baseCompensation - 1) * dampening
    setCompensatedScale(Math.max(0.7, Math.min(1.5, compensated)))
  }

  // Apply resistance at pan boundaries
  const applyResistance = (value: number, max: number) => {
    'worklet'
    if (max === 0) return 0 // Center when no overflow
    if (Math.abs(value) <= max) return value
    const overflow = Math.abs(value) - max
    const direction = value > 0 ? 1 : -1
    return direction * (max + overflow * PAN_RESISTANCE)
  }

  // Apply bounds to a translation value
  const applyBounds = (value: number, max: number) => {
    'worklet'
    if (max === 0) return 0
    if (Math.abs(value) > max) {
      return value > 0 ? max : -max
    }
    return value
  }

  // Pan gesture with bounds
  const pan = Gesture.Pan()
    .onStart(() => {
      prevTranslationX.value = translationX.value
      prevTranslationY.value = translationY.value
    })
    .onUpdate(event => {
      const { maxTranslateX, maxTranslateY } = calculateBounds()
      translationX.value = applyResistance(prevTranslationX.value + event.translationX, maxTranslateX)
      translationY.value = applyResistance(prevTranslationY.value + event.translationY, maxTranslateY)
    })
    .onEnd(() => {
      const { maxTranslateX, maxTranslateY } = calculateBounds()
      translationX.value = withSpring(applyBounds(translationX.value, maxTranslateX))
      translationY.value = withSpring(applyBounds(translationY.value, maxTranslateY))
    })

  // Pinch gesture for limited zoom
  const pinch = Gesture.Pinch()
    .onStart(() => {
      baseScale.value = scale.value
    })
    .onUpdate(event => {
      const newScale = baseScale.value * event.scale

      // Apply resistance at boundaries
      if (newScale < MIN_SCALE) {
        const overflow = MIN_SCALE - newScale
        scale.value = MIN_SCALE - overflow * SCALE_RESISTANCE
      } else if (newScale > MAX_SCALE) {
        const overflow = newScale - MAX_SCALE
        scale.value = MAX_SCALE + overflow * SCALE_RESISTANCE
      } else {
        scale.value = newScale
      }

      // Update compensated scale for child components
      scheduleOnRN(updateCompensatedScale, scale.value)
    })
    .onEnd(() => {
      // Snap back to limits with spring animation
      if (scale.value < MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE)
        scheduleOnRN(updateCompensatedScale, MIN_SCALE)
      } else if (scale.value > MAX_SCALE) {
        scale.value = withSpring(MAX_SCALE)
        scheduleOnRN(updateCompensatedScale, MAX_SCALE)
      }

      // Apply bounds after scale change
      const { maxTranslateX, maxTranslateY } = calculateBounds()
      translationX.value = withSpring(applyBounds(translationX.value, maxTranslateX))
      translationY.value = withSpring(applyBounds(translationY.value, maxTranslateY))
    })

  // Combine pan and pinch gestures
  const gesture = Gesture.Simultaneous(pan, pinch)

  // Animated style for zoom and pan
  // Order: translate first (in screen space), then scale around center
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
      { scale: scale.value }
    ],
  }))

  return (
    <View style={styles.container}>
      {/* Layer switch button */}
      <MapLayerSwitch />

      {/* Zoomable and pannable map surface */}
      <GestureHandlerRootView style={styles.gestureContainer}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.mapSurface, animatedStyle]}>
            <MapTrailPath boundary={trailBoundary} canvasSize={canvasSize} compensatedScale={compensatedScale} />
            <MapSpots boundary={trailBoundary} canvasSize={canvasSize} compensatedScale={compensatedScale} />
            <MapDeviceMarker boundary={trailBoundary} canvasSize={canvasSize} compensatedScale={compensatedScale} />
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </View>
  )
}

// Dynamic styles based on theme and canvas size
const createStyles = (theme: Theme, canvasSize: { width: number; height: number }) => ({
  container: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.deriveColor(theme.colors.background, 0.95),
    zIndex: 100,
  },
  gestureContainer: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  mapSurface: {
    width: canvasSize.width,
    height: canvasSize.height,
    backgroundColor: theme.deriveColor(theme.colors.surface, 0.3),
    borderRadius: 12,
    position: 'relative' as const,
  },
})

export default MapOverlay
