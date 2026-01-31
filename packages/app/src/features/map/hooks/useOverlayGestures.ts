import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import { ComposedGesture, Gesture } from 'react-native-gesture-handler'
import { SharedValue, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

// Gesture limits
const MIN_SCALE = 0.8
const MAX_SCALE = 1.5
const SCALE_RESISTANCE = 0.3
const PAN_RESISTANCE = 0.3
const EDGE_PADDING = 30
const WHEEL_ZOOM_SENSITIVITY = 0.002
const ELASTIC_PAN_DISTANCE = 80

interface OverlayGesturesConfig {
  canvasSize: { width: number; height: number }
  screenSize: { width: number; height: number }
  onScaleChange?: (scale: number) => void
}

interface OverlayGesturesResult {
  gesture: ComposedGesture
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  containerRef: React.RefObject<View | null>
  scale: SharedValue<number>
}

/**
 * Hook for Overview mode gestures with bounded pan and pinch-to-zoom
 * Handles elastic boundaries and scale resistance
 */
export const useOverlayGestures = (config: OverlayGesturesConfig): OverlayGesturesResult => {
  const { canvasSize, screenSize, onScaleChange } = config
  const containerRef = useRef<View>(null)

  // Zoom state
  const scale = useSharedValue(1)
  const baseScale = useSharedValue(1)

  // Pan state
  const translationX = useSharedValue(0)
  const translationY = useSharedValue(0)
  const prevTranslationX = useSharedValue(0)
  const prevTranslationY = useSharedValue(0)

  // Calculate translation bounds based on current scale
  const calculateBounds = () => {
    'worklet'
    const scaledWidth = canvasSize.width * scale.value
    const scaledHeight = canvasSize.height * scale.value
    const maxTranslateX = scaledWidth > screenSize.width ? (scaledWidth - screenSize.width) / 2 + EDGE_PADDING : 0
    const maxTranslateY = scaledHeight > screenSize.height ? (scaledHeight - screenSize.height) / 2 + EDGE_PADDING : 0

    return {
      maxTranslateX: Math.max(0, maxTranslateX),
      maxTranslateY: Math.max(0, maxTranslateY),
    }
  }

  // Apply resistance at pan boundaries
  const applyResistance = (value: number, max: number) => {
    'worklet'
    if (max === 0) {
      // Canvas fits in container - allow elastic panning
      if (Math.abs(value) > ELASTIC_PAN_DISTANCE) {
        const overflow = Math.abs(value) - ELASTIC_PAN_DISTANCE
        const direction = value > 0 ? 1 : -1
        return direction * (ELASTIC_PAN_DISTANCE + overflow * PAN_RESISTANCE)
      }
      return value
    }

    // Canvas larger than container
    if (Math.abs(value) <= max) return value
    const overflow = Math.abs(value) - max
    const direction = value > 0 ? 1 : -1
    return direction * (max + overflow * PAN_RESISTANCE)
  }

  // Clamp translation to bounds
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

  // Pinch gesture with scale limits
  const pinch = Gesture.Pinch()
    .onStart(() => {
      baseScale.value = scale.value
    })
    .onUpdate(event => {
      const newScale = baseScale.value * event.scale

      // Apply resistance at boundaries
      if (newScale < MIN_SCALE) {
        scale.value = MIN_SCALE - (MIN_SCALE - newScale) * SCALE_RESISTANCE
      } else if (newScale > MAX_SCALE) {
        scale.value = MAX_SCALE + (newScale - MAX_SCALE) * SCALE_RESISTANCE
      } else {
        scale.value = newScale
      }

      onScaleChange?.(scale.value)
    })
    .onEnd(() => {
      // Snap back to limits
      if (scale.value < MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE)
        onScaleChange?.(MIN_SCALE)
      } else if (scale.value > MAX_SCALE) {
        scale.value = withSpring(MAX_SCALE)
        onScaleChange?.(MAX_SCALE)
      }

      // Apply bounds after scale change
      const { maxTranslateX, maxTranslateY } = calculateBounds()
      translationX.value = withSpring(applyBounds(translationX.value, maxTranslateX))
      translationY.value = withSpring(applyBounds(translationY.value, maxTranslateY))
    })

  // Mouse wheel zoom (web)
  useEffect(() => {
    const container = containerRef.current as any
    if (!container?.addEventListener) return

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const delta = -event.deltaY * WHEEL_ZOOM_SENSITIVITY
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale.value + delta))

      scale.value = withSpring(newScale)
      onScaleChange?.(newScale)

      // Apply bounds after scale change
      const scaledWidth = canvasSize.width * newScale
      const scaledHeight = canvasSize.height * newScale
      const maxTranslateX = scaledWidth > screenSize.width ? (scaledWidth - screenSize.width) / 2 + EDGE_PADDING : 0
      const maxTranslateY = scaledHeight > screenSize.height ? (scaledHeight - screenSize.height) / 2 + EDGE_PADDING : 0

      translationX.value = withSpring(applyBounds(translationX.value, Math.max(0, maxTranslateX)))
      translationY.value = withSpring(applyBounds(translationY.value, Math.max(0, maxTranslateY)))
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [canvasSize, screenSize])

  const gesture = Gesture.Simultaneous(pan, pinch)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
      { scale: scale.value }
    ],
  }))

  return { gesture, animatedStyle, containerRef, scale }
}
