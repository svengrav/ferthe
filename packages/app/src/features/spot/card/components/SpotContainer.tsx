import { createThemedStyles, useTheme } from '@app/shared/theme'
import { ReactNode } from 'react'
import { Pressable, View } from 'react-native'

type SpotContainerVariant = 'marker' | 'grid' | 'card' | 'highlight'

interface SpotContainerProps {
  children: ReactNode
  variant?: SpotContainerVariant
  width: number
  height: number
  borderRadius?: number
  withShadow?: boolean
  onPress?: () => void
}

/**
 * Container frame for spot components.
 * Provides consistent border, shadow, and dimensions across variants.
 */
function SpotContainer({
  children,
  variant = 'card',
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
    <View style={[styles.container, containerStyle, shadowStyle]}>
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
    shadowColor: theme.colors.surface,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
}))

export default SpotContainer
