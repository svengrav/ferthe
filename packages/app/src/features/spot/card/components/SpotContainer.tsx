import { createThemedStyles, useTheme } from '@app/shared/theme'
import { ReactNode } from 'react'
import { Pressable, StyleProp, View, ViewStyle } from 'react-native'

type SpotContainerVariant = 'marker' | 'grid' | 'card' | 'highlight'

interface SpotContainerProps {
  children: ReactNode
  variant?: SpotContainerVariant
  width: number
  height: number
  borderRadius?: number
  withShadow?: boolean
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * Container frame for spot components.
 * Provides consistent border, shadow, and dimensions across variants.
 */
function SpotContainer({
  children,
  style,
  width,
  height,
  borderRadius = 18,
  withShadow = true,
  onPress,
}: SpotContainerProps) {
  const { styles, theme } = useTheme(useStyles)

  const containerStyle = {
    width,
    height,
    borderRadius,
  }

  const shadowStyle = withShadow ? styles.shadow : undefined

  if (!styles) return null

  const content = (
    <View style={[styles.container, containerStyle, shadowStyle, style]}>
      {children}
    </View>
  )

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>
  }

  return content
}

const useStyles = createThemedStyles(theme => ({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  shadow: {
    elevation: 8,

  },
}))

export default SpotContainer
