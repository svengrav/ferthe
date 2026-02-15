import { Theme, useTheme } from '@app/shared/theme'
import { ForwardedRef, forwardRef, ReactNode } from 'react'
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native'
import { SizeableProps, VariantableProps } from '../types'

const SHADOW_OPACITY = 0.1
const ELEVATION = 4

interface CardProps extends SizeableProps, VariantableProps {
  children?: ReactNode
  onPress?: () => void
  style?: ViewStyle
}

/**
 * Card component with theme-aware variants and sizes.
 * Supports primary, secondary, and outlined variants with optional press functionality.
 */
function Card(props: CardProps, ref: ForwardedRef<View>) {
  const { children, style, variant = 'secondary', size = 'md', onPress, ...rest } = props
  const { styles, theme } = useTheme(createStyles)

  const sizeConfig = {
    sm: theme.tokens.spacing.sm,
    md: theme.tokens.spacing.md,
    lg: theme.tokens.spacing.lg,
  }[size]

  const cardStyle = [
    styles.base,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'outlined' && styles.outlined,
    { padding: sizeConfig } satisfies ViewStyle,
    style,
  ]

  if (onPress) {
    return (
      <Pressable onPress={onPress} {...rest}>
        <View ref={ref} style={cardStyle} id="card-pressable">
          {children}
        </View>
      </Pressable>
    )
  }

  return (
    <View ref={ref} style={cardStyle} {...rest} id="card-static">
      {children}
    </View>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      borderRadius: theme.tokens.borderRadius.md,
      overflow: 'hidden',
    },
    primary: {
      backgroundColor: theme.colors.primary,
      ...theme.tokens.shadows.md,
      shadowColor: theme.colors.black,
      shadowOpacity: SHADOW_OPACITY,
      elevation: ELEVATION,
    },
    secondary: {
      backgroundColor: theme.colors.surface,
      ...theme.tokens.shadows.md,
      shadowColor: theme.colors.black,
      shadowOpacity: SHADOW_OPACITY,
      elevation: 0.1,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.divider,
    },
  })

export default forwardRef(Card)
