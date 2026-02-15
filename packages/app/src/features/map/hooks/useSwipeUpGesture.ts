import { Gesture } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'

const SWIPE_THRESHOLD = -50 // Negative = upward
const VELOCITY_THRESHOLD = 500 // Minimum velocity for swipe detection

/**
 * Hook to detect swipe-up gesture
 * @param onSwipeUp Callback triggered when swipe up is detected
 * @returns Gesture handler for swipe up
 */
export const useSwipeUpGesture = (onSwipeUp: () => void) => {
  const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
      'worklet'
      const isSwipeUp = event.translationY < SWIPE_THRESHOLD || event.velocityY < -VELOCITY_THRESHOLD

      if (isSwipeUp) {
        runOnJS(onSwipeUp)()
      }
    })

  return swipeGesture
}
