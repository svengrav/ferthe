import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet } from 'react-native'

interface SpotGradientBackgroundProps {
  colors: readonly [string, string, ...string[]]
  width: number
  height: number
}

/**
 * Gradient background layer for spot cards.
 * Absolutely positioned, acts as decorative background behind card content.
 * Use as sibling to SpotImage, not as wrapper.
 * 
 * Usage:
 * <SpotContainer>
 *   <SpotGradientBackground colors={['#...', '#...']} width={w} height={h} />
 *   <SpotImage />
 *   <SpotTitle />
 * </SpotContainer>
 */
function SpotGradientBackground({ colors, width, height }: SpotGradientBackgroundProps) {
  const gradientStyle = {
    width,
    height,
  }

  return (
    <LinearGradient
      colors={colors}
      style={[styles.gradient, gradientStyle]}
    />
  )
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
})

export default SpotGradientBackground
