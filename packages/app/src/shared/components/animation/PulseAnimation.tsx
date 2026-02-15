import React, { useEffect } from 'react'
import { ViewProps } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'

interface PulseViewProps extends ViewProps {
  children: React.ReactNode
  minOpacity?: number
  maxOpacity?: number
  duration?: number
  style?: any
}

function PulseAnimation({
  children,
  minOpacity = 0.6,
  maxOpacity = 1,
  duration = 1500,
  style,
  ...props
}: PulseViewProps) {
  const opacity = useSharedValue(maxOpacity)

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(minOpacity, {
          duration,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(maxOpacity, {
          duration,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1, // infinite loop
      false // don't reverse
    )
  }, [minOpacity, maxOpacity, duration])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        animatedStyle,
        style,
      ]}
      {...props}>
      {children}
    </Animated.View>
  )
}

export default PulseAnimation
