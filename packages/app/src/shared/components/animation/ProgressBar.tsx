import { useTheme } from '@app/shared/theme'
import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

interface ProgressBarProps {
  percentage: number
  duration?: number
  color?: string
  backgroundColor?: string
  height?: number
}

/**
 * Horizontal progress bar with animated fill on mount.
 * Fills from 0% to the specified percentage.
 */
function ProgressBar(props: ProgressBarProps) {
  const { percentage, duration = 800, color, backgroundColor, height = 6 } = props
  const { theme } = useTheme()
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(100, percentage)), {
      duration,
      easing: Easing.out(Easing.cubic),
    })
  }, [percentage, duration])

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
