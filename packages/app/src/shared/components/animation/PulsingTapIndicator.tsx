import { useEffect } from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated'

interface PulsingTapIndicatorProps {
  size?: number
  innerSize?: number
  style?: ViewStyle
}

/**
 * Pulsing tap indicator with concentric circles.
 * Continuously animates scale from 1.0 to 1.3 for tap affordance.
 */
export function PulsingTapIndicator({ size = 80, innerSize = 40, style }: PulsingTapIndicatorProps) {
  const scale = useSharedValue(1)

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1, // infinite loop
      false // don't reverse
    )
  }, [scale])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const outerCircleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  }

  const innerCircleStyle = {
    width: innerSize,
    height: innerSize,
    borderRadius: innerSize / 2,
  }

  return (
    <Animated.View style={[styles.outerCircle, outerCircleStyle, animatedStyle, style]}>
      <View style={[styles.innerCircle, innerCircleStyle]} />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  outerCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.91)',
  },
})
