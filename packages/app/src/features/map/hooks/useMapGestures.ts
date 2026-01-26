import { logger } from '@app/shared/utils/logger'
import { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { Gesture } from 'react-native-gesture-handler'
import { configureReanimatedLogger, ReanimatedLogLevel, runOnJS, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated'
import { useMapScale, useSetScale, useZoomMode } from '../stores/mapStore'

// Map coordinate system:
// mapSize = Real size of the map surface (eg. 1000x1000 pixels)
// containerSize = Size of the view (device screen) that holds the map (eg. 400x600 pixels)
// scale = Scale configuration with initial, min, and max values

// Constants
const MIN_VISIBLE_PORTION = 0.4
const CENTER_RESISTANCE = 0.3
const EDGE_RESISTANCE = 0.5
const EDGE_RESISTANCE_OVERVIEW = 0.2 // Stricter resistance in overview mode
const SCALE_RESISTANCE = 0.2
const TAP_MAX_DURATION = 250
const PAN_MIN_DISTANCE = 1
const WEB_ZOOM_OUT = 0.8
const WEB_ZOOM_IN = 1.2

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
})

interface GestureHandlers {
  gesture: any
  animatedStyles: any
  inverseScale: number
}
/**
 * Custom hook to handle map gestures (pan, pinch, and tap)
 * @param mapData Map data containing scale, mapSize, and containerSize
 * @param onTap Optional callback for tap-to-geo coordinate conversion
 * @returns Gesture handlers and related state
 */
export const useMapGestures = (
  canvas: {
    scale: { init: number; min: number; max: number }
    size: { width: number; height: number }
  },
  viewBox: { width: number; height: number },
  onTap?: (position: { x: number; y: number }) => void
): GestureHandlers => {
  // Props extraction
  const { init: initialScale, min: minScale, max: maxScale } = canvas.scale
  const { width: mapWidth, height: mapHeight } = canvas.size
  const { width: viewBoxWidth, height: viewBoxHeight } = viewBox

  // Store actions and state
  const setScale = useSetScale()
  const zoomMode = useZoomMode()
  const storeScale = useMapScale()

  // State
  const scale = useSharedValue(initialScale)
  const baseScale = useSharedValue(initialScale)
  const translationX = useSharedValue(0)
  const translationY = useSharedValue(0)
  const prevTranslationX = useSharedValue(0)
  const prevTranslationY = useSharedValue(0)

  // Derived value for inverse scale - calculated on demand
  const inverseScale = useDerivedValue(() => 1 / scale.value)

  // React state for reactive inverse scale value
  const [reactiveInverseScale, setReactiveInverseScale] = useState(1 / initialScale)

  // Spring animation config
  const springConfig = {
    damping: 10,
    stiffness: 100,
    mass: 0.5,
    overshootClamping: false,
  }

  // Helper functions

  /**
   * Calculate translation bounds based on current scale
   * Ensures map content remains visible within container
   */
  const calculateBounds = () => {
    'worklet'
    const scaledWidth = mapWidth * scale.value
    const scaledHeight = mapHeight * scale.value

    // When map is smaller than container, center it
    if (scaledWidth <= viewBoxWidth && scaledHeight <= viewBoxHeight) {
      return {
        maxTranslateX: 0,
        maxTranslateY: 0,
        shouldCenterX: true,
        shouldCenterY: true,
      }
    }

    // When map is larger than container, calculate bounds to keep minimum portion visible
    const maxTranslateX = scaledWidth > viewBoxWidth ? (scaledWidth - viewBoxWidth * MIN_VISIBLE_PORTION) / 2 : 0

    const maxTranslateY = scaledHeight > viewBoxHeight ? (scaledHeight - viewBoxHeight * MIN_VISIBLE_PORTION) / 2 : 0

    return {
      maxTranslateX: Math.max(0, maxTranslateX),
      maxTranslateY: Math.max(0, maxTranslateY),
      shouldCenterX: scaledWidth <= viewBoxWidth,
      shouldCenterY: scaledHeight <= viewBoxHeight,
    }
  }

  // Effects
  useEffect(() => {
    if (scale.value !== initialScale) {
      scale.value = initialScale
      baseScale.value = initialScale
    }
  }, [initialScale])

  // Wrap applyBoundsWithBounce with useCallback for stable reference
  const applyBoundsWithBounce = useCallback(() => {
    'worklet'
    const { maxTranslateX, maxTranslateY, shouldCenterX, shouldCenterY } = calculateBounds()

    // Handle X-axis bounds
    if (shouldCenterX) {
      translationX.value = withSpring(0, springConfig)
    } else if (Math.abs(translationX.value) > maxTranslateX) {
      const targetX = translationX.value > 0 ? maxTranslateX : -maxTranslateX
      translationX.value = withSpring(targetX, springConfig)
    }

    // Handle Y-axis bounds
    if (shouldCenterY) {
      translationY.value = withSpring(0, springConfig)
    } else if (Math.abs(translationY.value) > maxTranslateY) {
      const targetY = translationY.value > 0 ? maxTranslateY : -maxTranslateY
      translationY.value = withSpring(targetY, springConfig)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewBoxWidth, viewBoxHeight])

  // React to external scale changes (e.g., from zoom mode transitions)
  useEffect(() => {
    // Only react to significant external changes (not from internal gestures)
    if (Math.abs(storeScale - scale.value) > 0.1) {
      scale.value = withSpring(storeScale, springConfig, (finished) => {
        'worklet'
        if (finished) applyBoundsWithBounce()
      })
      baseScale.value = storeScale
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeScale])

  // Web mouse wheel support
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWheel = (event: WheelEvent) => {
        event.preventDefault()
        const zoomFactor = event.deltaY > 0 ? WEB_ZOOM_OUT : WEB_ZOOM_IN
        const currentScale = scale.value
        const newScale = currentScale * zoomFactor

        if (newScale >= minScale && newScale <= maxScale) {
          // Use runOnUI to safely execute worklet code from JS context
          runOnJS(() => {
            'worklet'
            scale.value = withSpring(newScale, springConfig, () => {
              'worklet'
              // Apply bounds check immediately after animation completes
              applyBoundsWithBounce()
            })
            baseScale.value = newScale
          })()
        }
      }

      const element = document.getElementById('map-content')
      element?.addEventListener('wheel', handleWheel)
      return () => element?.removeEventListener('wheel', handleWheel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewBoxWidth, viewBoxHeight])

  // Update reactive inverse scale when scale changes
  useAnimatedReaction(
    () => scale.value,
    (currentScale, previousScale) => {
      runOnJS(setReactiveInverseScale)(1 / currentScale)
      // Only update store if change is significant and not from external source
      // This prevents feedback loops during gestures
      if (previousScale !== null && Math.abs(currentScale - storeScale) > 0.05) {
        runOnJS(setScale)(currentScale)
      }
    }
  )

  /**
   * Apply resistance when dragging beyond bounds
   * Provides smooth feedback when map reaches edges
   * Uses stricter resistance in OVERVIEW mode
   */
  const applyResistance = (value: number, max: number, shouldCenter: boolean, isOverviewMode: boolean) => {
    'worklet'
    if (shouldCenter) {
      return value * CENTER_RESISTANCE
    }

    if (Math.abs(value) <= max) return value

    const overflow = Math.abs(value) - max
    const direction = value > 0 ? 1 : -1

    // Use stricter resistance in overview mode to keep trail in focus
    const resistance = isOverviewMode ? EDGE_RESISTANCE_OVERVIEW : EDGE_RESISTANCE

    return direction * (max + overflow * resistance)
  }

  // Event handlers

  /**
   * Pan gesture for map dragging with edge resistance
   */
  const pan = Gesture.Pan()
    .minDistance(PAN_MIN_DISTANCE)
    .onStart(() => {
      prevTranslationX.value = translationX.value
      prevTranslationY.value = translationY.value
    })
    .onUpdate(event => {
      const { maxTranslateX, maxTranslateY, shouldCenterX, shouldCenterY } = calculateBounds()
      const newTranslationX = prevTranslationX.value + event.translationX
      const newTranslationY = prevTranslationY.value + event.translationY

      const isOverview = zoomMode === 'OVERVIEW'

      translationX.value = applyResistance(newTranslationX, maxTranslateX, shouldCenterX, isOverview)
      translationY.value = applyResistance(newTranslationY, maxTranslateY, shouldCenterY, isOverview)
    })
    .onEnd(() => {
      applyBoundsWithBounce()
    })

  /**
   * Pinch gesture for map scaling with resistance beyond limits
   */
  const pinch = Gesture.Pinch()
    .onStart(() => {
      baseScale.value = scale.value
    })
    .onUpdate(event => {
      const newScaleRaw = baseScale.value * event.scale

      if (newScaleRaw < minScale) {
        const overflow = minScale - newScaleRaw
        scale.value = minScale - overflow * SCALE_RESISTANCE
      } else if (newScaleRaw > maxScale) {
        const overflow = newScaleRaw - maxScale
        scale.value = maxScale + overflow * SCALE_RESISTANCE
      } else {
        scale.value = newScaleRaw
      }
    })
    .onEnd(() => {
      // Apply spring animation when returning to scale limits
      if (scale.value < minScale) {
        scale.value = withSpring(minScale, springConfig, (finished) => {
          'worklet'
          if (finished) applyBoundsWithBounce()
        })
      } else if (scale.value > maxScale) {
        scale.value = withSpring(maxScale, springConfig, (finished) => {
          'worklet'
          if (finished) applyBoundsWithBounce()
        })
      } else {
        // Scale is within limits - apply bounds immediately
        applyBoundsWithBounce()
      }
    })

  const handlecallBack = (x: number, y: number) => {
    try {
      if (!onTap) return
      onTap({ x, y })
    } catch (error) {
      logger.error('Tap conversion failed:', error)
    }
  }

  /**
   * Single tap gesture for geo coordinate conversion
   */
  const singleTap = Gesture.Tap()
    .maxDuration(TAP_MAX_DURATION)
    .onStart(state => {
      if (!onTap) return
      runOnJS(handlecallBack)(state.x, state.y)
    })
  // Combine gestures and create animated styles
  const gesture = Gesture.Simultaneous(pan, pinch, singleTap)

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateX: translationX.value }, { translateY: translationY.value }, { scale: scale.value }],
  }))

  // Return gesture handlers and state
  return {
    gesture,
    animatedStyles,
    inverseScale: reactiveInverseScale,
  }
}
