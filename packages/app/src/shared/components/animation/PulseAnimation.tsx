import React, { useEffect, useRef } from 'react'
import { Animated, Easing, ViewProps } from 'react-native'

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
  const opacityAnim = useRef(new Animated.Value(maxOpacity)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: minOpacity,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: maxOpacity,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )

    pulse.start()

    return () => {
      pulse.stop()
    }
  }, [opacityAnim, minOpacity, maxOpacity, duration])

  return (
    <Animated.View
      style={[
        {
          opacity: opacityAnim,
        },
        style,
      ]}
      {...props}>
      {children}
    </Animated.View>
  )
}

export default PulseAnimation
