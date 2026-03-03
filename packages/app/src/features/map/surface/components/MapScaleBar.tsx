import { Text } from '@app/shared/components'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { View } from 'react-native'
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated'

interface MapScaleBarProps {
  scale: SharedValue<number>
  /** Meters per pixel at scale = 1 */
  metersPerPixelAtScale1: number
}

/** Picks the nearest "nice" round distance for the label */
function niceDistance(meters: number): number {
  const targets = [50, 100, 200, 500, 1000, 2000, 5000]
  return targets.reduce((prev, curr) =>
    Math.abs(curr - meters) < Math.abs(prev - meters) ? curr : prev
  )
}

/**
 * Scale bar overlay that visually grows/shrinks with map zoom.
 * The bar represents a fixed geographic distance (auto-selected for ~80px initial render).
 */
function MapScaleBar({ scale, metersPerPixelAtScale1 }: MapScaleBarProps) {
  const { styles } = useTheme(useStyles)

  // Pick a label distance that yields ~80px bar at scale=1
  const targetMeters = 80 * metersPerPixelAtScale1
  const labelMeters = niceDistance(targetMeters)
  const barWidthAtScale1 = labelMeters / metersPerPixelAtScale1

  const barStyle = useAnimatedStyle(() => ({
    width: barWidthAtScale1 * scale.value,
  }), [barWidthAtScale1])

  const label = labelMeters >= 1000 ? `${labelMeters / 1000}km` : `${labelMeters}m`

  if (!styles) return null

  return (
    <>
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'transparent']}
        style={styles.gradientTop}
        pointerEvents="none"
      >
        <View style={styles.content}>
          <Animated.View style={[styles.bar, barStyle]} />
          <Text style={styles.label}>{label}</Text>
        </View>
      </LinearGradient>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.2)']}
        style={styles.gradientBottom}
        pointerEvents="none"
      />
    </>
  )
}

const useStyles = createThemedStyles(() => ({
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    pointerEvents: 'none',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    pointerEvents: 'none',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 1,
    marginBottom: 3,
  },
  label: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    fontVariant: ['tabular-nums'],
  },
}))

export default MapScaleBar
