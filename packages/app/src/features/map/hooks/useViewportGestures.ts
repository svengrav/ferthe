import { ComposedGesture, Gesture } from 'react-native-gesture-handler'
import { SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useMapContainerSize } from '../stores/mapStore'
import { calculateMinScale } from '../utils/viewportUtils'
import { useMapWheelZoom } from './useMapWheelZoom'

interface ViewportGestureConfig {
  width: number
  height: number
  minScale?: number
  maxScale?: number
  initialScale?: number
  elementId?: string
  snapToCenter?: boolean
  onLongPress?: (x: number, y: number) => void
  onGestureEnd?: (scale: number, translationX: number, translationY: number) => void
}

interface ViewportGestureHandlers {
  gesture: ComposedGesture
  animatedStyles: any
  scale: SharedValue<number>
  compensatedScale: SharedValue<number>
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
    minScale: configMinScale,
    maxScale = 3,
    initialScale = 1,
    elementId = 'viewport-content',
    snapToCenter = false,
    onLongPress,
    onGestureEnd,
  } = config

  // Calculate dynamic minScale based on container/viewport ratio
  const containerSize = useMapContainerSize()
  const calculatedMinScale = calculateMinScale(containerSize, { width, height })
  const minScale = configMinScale ?? calculatedMinScale

  // Ensure maxScale is always greater than minScale
  const effectiveMaxScale = Math.max(maxScale, minScale * 1.1)

  // Gesture state
  const scale = useSharedValue(initialScale)
  const baseScale = useSharedValue(initialScale)
  const translationX = useSharedValue(0)
  const translationY = useSharedValue(0)
  const prevTranslationX = useSharedValue(0)
  const prevTranslationY = useSharedValue(0)

  // Compensated scale for child elements (keeps markers stable during zoom)
  const compensatedScale = useDerivedValue(() => {
    const baseCompensation = (1 / scale.value) * 2
    const dampening = 0.7
    const compensated = 1 + (baseCompensation - 1) * dampening
    return Math.max(0.6, Math.min(1.8, compensated))
  }, [scale])

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

      // Notify listeners of final values (target values after spring)
      if (onGestureEnd) {
        scheduleOnRN(onGestureEnd, scale.value,
          snapToCenter ? 0 : translationX.value,
          snapToCenter ? 0 : translationY.value)
      }
    })
  // Pinch gesture
  const pinch = Gesture.Pinch()
    .onStart(() => {
      baseScale.value = scale.value
    })
    .onUpdate(event => {
      const newScale = baseScale.value * event.scale
      scale.value = Math.max(minScale, Math.min(effectiveMaxScale, newScale))
    })
    .onEnd(() => {
      if (scale.value < minScale) {
        scale.value = withSpring(minScale, SPRING_CONFIG)
      } else if (scale.value > effectiveMaxScale) {
        scale.value = withSpring(effectiveMaxScale, SPRING_CONFIG)
      }

      // Reset translation after pinch zoom if snap-to-center enabled
      if (snapToCenter) {
        translationX.value = withSpring(0, SPRING_CONFIG)
        translationY.value = withSpring(0, SPRING_CONFIG)
      }

      // Notify listeners of final values
      if (onGestureEnd) {
        scheduleOnRN(onGestureEnd, scale.value,
          snapToCenter ? 0 : translationX.value,
          snapToCenter ? 0 : translationY.value)
      }
    })

  // Mouse wheel zoom support (web only)
  useMapWheelZoom({
    scale,
    translationX,
    translationY,
    minScale,
    maxScale: effectiveMaxScale,
    elementId,
    onBoundsUpdate: handleBoundsUpdate,
    onGestureEnd,
  })

  // Long press gesture for debug teleport
  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onStart((event) => {
      if (onLongPress) {
        scheduleOnRN(onLongPress, event.x, event.y)
      }
    })

  // Combined gesture - long press runs simultaneously but doesn't block pan/pinch
  const gesture = Gesture.Race(
    longPress,
    Gesture.Simultaneous(pan, pinch)
  )

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
    compensatedScale,
    translationX,
    translationY,
  }
}
