import { Theme, useThemeStore } from '@app/shared/theme'
import React from 'react'
import * as Native from 'react-native'

interface TextProps extends Native.TextProps {
  size?: 'small' | 'medium' | 'large'
  weight?: 'regular' | 'bold' | 'semibold'
  color?: string
  variant?: 'primary' | 'secondary' | 'third'
}

const Text = ({ size, weight, color, style, children, variant = 'primary', ...props }: TextProps) => {
  const theme = useThemeStore() as Theme
  const variantStyle = createTextVariantStyle(theme, variant, color)

  return (
    <Native.Text style={[{ fontFamily: theme.text.primary.regular }, variantStyle, style]} {...props}>
      {children}
    </Native.Text>
  )
}

const createTextVariantStyle = (theme: Theme, variant: 'primary' | 'secondary' | 'third', color?: string) => {
  switch (variant) {
    case 'secondary':
      return { color: theme.colors.onBackground, opacity: 0.3 }
    case 'third':
      return { color: theme.colors.onSurface, opacity: 0.4, ...theme.text.size.sm }
    case 'primary':
    default:
      return { color: color ? color : theme.colors.onSurface }
  }
}

export default Text
