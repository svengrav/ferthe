import { Text } from '@app/shared/components'
import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

const ANIMATION_DURATION = 400

interface SpotTitleProps {
  title?: string
  position?: 'top' | 'center' | 'bottom'
  top?: number
  animated?: boolean
}

/**
 * Title overlay for spot images.
 * Positioned absolutely over the image with drop shadow for readability.
 */
function SpotTitle({ title, position = 'bottom', top, animated = false }: SpotTitleProps) {
  const opacity = useSharedValue(animated ? 0 : 1)

  useEffect(() => {
    if (animated) {
      opacity.value = withTiming(1, { duration: ANIMATION_DURATION })
    }
  }, [animated, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const positionStyle = top !== undefined
    ? { top }
    : position === 'top'
      ? styles.positionTop
      : position === 'center'
        ? styles.positionCenter
        : styles.positionBottom

  return (
    <Animated.View style={[styles.container, positionStyle, animated && animatedStyle]} pointerEvents="none">
      {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    zIndex: 2,
  },
  positionTop: {
    top: 0,
  },
  positionCenter: {
    top: '50%',
    transform: [{ translateY: -20 }],
  },
  positionBottom: {
    bottom: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 'semibold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,

  },
})

export default SpotTitle
