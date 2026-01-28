import { Gesture } from 'react-native-gesture-handler'
import { SharedValue, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useMapWheelZoom } from './useMapWheelZoom'

interface ViewportGestureConfig {
  width: number
  height: number
  minScale?: number
  maxScale?: number
  initialScale?: number
  elementId?: string
  snapToCenter?: boolean
}

interface ViewportGestureHandlers {
  gesture: any
  animatedStyles: any
  scale: SharedValue<number>
  translationX: SharedValue<number>
  translationY: SharedValue<number>
}

const SPRING_CONFIG = {
  damping: 10,
  stiffness: 100,
  mass: 0.5,
}

/**
 * Generic viewport gesture handler
 * Handles pan and pinch gestures for any viewport
 * Independent of map-specific logic
 */
export const useViewportGestures = (config: ViewportGestureConfig): ViewportGestureHandlers => {
  const {
    width,
    height,
    minScale = 0.1,
    maxScale = 3,
    initialScale = 1,
    elementId = 'viewport-content',
    snapToCenter = false,
  } = config

  // Gesture state
  const scale = useSharedValue(initialScale)
  const baseScale = useSharedValue(initialScale)
  const translationX = useSharedValue(0)
  const translationY = useSharedValue(0)
  const prevTranslationX = useSharedValue(0)
  const prevTranslationY = useSharedValue(0)

  // Dummy bounds update function (no bounds in generic viewport)
  const handleBoundsUpdate = () => {
    'worklet'
    // Reset translation after zoom if snap-to-center is enabled
    if (snapToCenter) {
      translationX.value = 0
      translationY.value = 0
    }
  }

  // Pan gesture
  const pan = Gesture.Pan()
    .onStart(() => {
      prevTranslationX.value = translationX.value
      prevTranslationY.value = translationY.value
    })
    .onUpdate(event => {
      translationX.value = prevTranslationX.value + event.translationX
      translationY.value = prevTranslationY.value + event.translationY
    })
    .onEnd(() => {
      // Snap back to center if enabled
      if (snapToCenter) {
        translationX.value = withSpring(0, SPRING_CONFIG)
        translationY.value = withSpring(0, SPRING_CONFIG)
      }
    })

  // Pinch gesture
  const pinch = Gesture.Pinch()
    .onStart(() => {
      baseScale.value = scale.value
    })
    .onUpdate(event => {
      const newScale = baseScale.value * event.scale
      scale.value = Math.max(minScale, Math.min(maxScale, newScale))
    })
    .onEnd(() => {
      if (scale.value < minScale) {
        scale.value = withSpring(minScale, SPRING_CONFIG)
      } else if (scale.value > maxScale) {
        scale.value = withSpring(maxScale, SPRING_CONFIG)
      }

      // Reset translation after pinch zoom if snap-to-center enabled
      if (snapToCenter) {
        translationX.value = withSpring(0, SPRING_CONFIG)
        translationY.value = withSpring(0, SPRING_CONFIG)
      }
    })

  // Mouse wheel zoom support (web only)
  useMapWheelZoom({
    scale,
    translationX,
    translationY,
    minScale,
    maxScale,
    elementId,
    onBoundsUpdate: handleBoundsUpdate,
  })

  // Combined gesture
  const gesture = Gesture.Simultaneous(pan, pinch)

  // Animated styles
  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
      { scale: scale.value },
    ],
  }))

  return {
    gesture,
    animatedStyles,
    scale,
    translationX,
    translationY,
  }
}
