import { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Theme, useTheme } from '@app/shared/theme'

const DEFAULT_GRADIENT_COLORS = ['rgba(69, 69, 69, 0.66)', 'rgba(46, 46, 46, 0.767)'] as const

interface SpotGradientFrameProps {
  colors?: readonly [string, string, ...string[]]
  children: ReactNode
  padding?: number
}

/**
 * Gradient frame wrapper that creates a border-like frame effect.
 * The padding controls the space between the gradient border and the inner content.
 */
function SpotGradientFrame(props: SpotGradientFrameProps) {
  const { colors = DEFAULT_GRADIENT_COLORS, children, padding = 0 } = props
  const { styles, theme } = useTheme(createStyles)

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors} style={styles.gradient} />
      <View style={{ padding, flex: 1 }}>
        <View style={[styles.inner]}>
          {children}
        </View>
      </View>
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
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
  inner: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: theme.colors.background
  },
})

export default SpotGradientFrame
