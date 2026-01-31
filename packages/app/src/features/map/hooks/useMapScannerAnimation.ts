import { getAppContext } from '@app/appContext'
import { useEvent } from '@app/shared/events/useEvent'
import { useEffect } from 'react'
import { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated'

interface MapScannerAnimationProps {
  point: { x: number; y: number }
  width: number
  style?: { strokeColor?: string; strokeWidth?: number; fill: string }
}

/**
 * Hook for map scanning functionality
 * Handles scanner animations and state management
 */
export const useMapScannerAnimation = ({ point, width, style }: MapScannerAnimationProps) => {
  // Shared values for animations
  const sensorApplication = getAppContext().sensorApplication
  const animatedRadius = useSharedValue(0)
  const animatedPoint = useSharedValue({ x: 0, y: 0 })
  const animatedWidth = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    const currentRadius = animatedRadius.value
    return {
      left: animatedPoint.value.x - currentRadius,
      top: animatedPoint.value.y - currentRadius,
      width: currentRadius * 2,
      height: currentRadius * 2,
      borderRadius: currentRadius,
      backgroundColor: style?.fill || 'rgba(64, 156, 255, 0.2)',
      borderWidth: style?.strokeWidth || 1.5,
      borderColor: style?.strokeColor || 'rgba(64, 156, 255, 0.6)',
      position: 'absolute',
    }
  })

  // Update position and radius when viewport changes
  useEffect(() => {
    animatedPoint.value = point
    // width is diameter, we need radius for animation
    animatedWidth.value = width / 2
  }, [point, width, animatedPoint, animatedWidth])

  const startScanAnimation = () => {
    animatedRadius.value = 0
    animatedRadius.value = withSequence(
      withTiming(animatedWidth.value, { duration: 1000, easing: Easing.out(Easing.ease) }),
      withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) })
    )
  }

  useEvent(sensorApplication.onScanEvent, startScanAnimation)

  return {
    animatedStyle,
  }
}
