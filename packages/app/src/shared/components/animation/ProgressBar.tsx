import { useTheme } from '@app/shared/theme'
import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'

interface ProgressBarProps {
  percentage: number
  duration?: number
  delay?: number
  color?: string
  backgroundColor?: string
  height?: number
  trigger?: boolean
}

/**
 * Horizontal progress bar with animated fill.
 * Fills from 0% to the specified percentage.
 * @param trigger - If provided, animation starts only when trigger becomes true. Otherwise animates on mount.
 */
function ProgressBar(props: ProgressBarProps) {
  const { percentage, duration = 800, delay = 0, color, backgroundColor, height = 6, trigger } = props
  const { theme } = useTheme()
  const progress = useSharedValue(0)

  useEffect(() => {
    const animate = () => withTiming(Math.max(0, Math.min(100, percentage)), {
      duration,
      easing: Easing.out(Easing.cubic),
    })

    if (trigger === undefined) {
      // Auto-start on mount if no trigger provided
      progress.value = delay > 0 ? withDelay(delay, animate()) : animate()
    } else if (trigger === false) {
      // Reset to 0 when trigger is false
      progress.value = 0
    } else if (trigger === true) {
      // Animate when trigger becomes true
      progress.value = delay > 0 ? withDelay(delay, animate()) : animate()
    }
  }, [percentage, duration, delay, trigger])

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }))

  const defaultColor = color || theme.colors.primary
  const defaultBgColor = backgroundColor || theme.colors.divider

  return (
    <View style={[styles.container, { height, backgroundColor: defaultBgColor }]}>
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: defaultColor },
          animatedStyle,
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
})

export default ProgressBar
