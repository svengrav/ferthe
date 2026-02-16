import { LinearGradient } from 'expo-linear-gradient'
import { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

interface SpotGradientFrameProps {
  colors: readonly [string, string, ...string[]]
  children: ReactNode
  padding?: number
}

/**
 * Gradient frame wrapper with padding that creates frame effect.
 * The padding creates space between gradient background and inner content.
 * 
 * Usage:
 * <SpotContainer width={300} height={450}>
 *   <SpotGradientFrame colors={['#...', '#...']} padding={6}>
 *     <SpotImage />
 *   </SpotGradientFrame>
 * </SpotContainer>
 */
function SpotGradientFrame({ colors, children, padding = 0 }: SpotGradientFrameProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors}
        style={styles.gradient}
      />
      <View style={{ padding, flex: 1 }}>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})

export default SpotGradientFrame
