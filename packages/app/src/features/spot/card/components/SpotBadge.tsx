import { Text } from '@app/shared/components'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { StyleSheet, View } from 'react-native'

interface SpotBadgeProps {
  text: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

/**
 * Badge overlay for spot images.
 * Displays additional information like discoverer name or stats.
 */
function SpotBadge({ text, position = 'top-left' }: SpotBadgeProps) {
  const { styles, theme } = useTheme(useStyles)

  const positionStyle =
    position === 'top-right'
      ? staticStyles.positionTopRight
      : position === 'bottom-left'
        ? staticStyles.positionBottomLeft
        : position === 'bottom-right'
          ? staticStyles.positionBottomRight
          : staticStyles.positionTopLeft

  if (!styles) return null

  return (
    <View style={[styles.badge, positionStyle]}>
      <Text variant="body">{text}</Text>
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  badge: {
    position: 'absolute',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 3,
  },
}))

const staticStyles = StyleSheet.create({
  positionTopLeft: {
    top: 12,
    left: 12,
  },
  positionTopRight: {
    top: 12,
    right: 12,
  },
  positionBottomLeft: {
    bottom: 12,
    left: 12,
  },
  positionBottomRight: {
    bottom: 12,
    right: 12,
  },
})

export default SpotBadge
