import { useThemeStore } from '@app/shared/theme'
import { PRIMITIVES } from '@app/shared/theme/theme'
import { TextTheme } from '@app/shared/theme/types'
import * as Native from 'react-native'
import { ComponentSize } from '../types'

type TextVariant = keyof TextTheme

interface TextProps extends Native.TextProps {
  variant?: TextVariant
  size?: ComponentSize
}

const Text = ({ style, children, variant = 'body', size, ...props }: TextProps) => {
  const theme = useThemeStore()

  const sizeOverride = size ? {
    fontSize: PRIMITIVES.fontSize[size],
    lineHeight: PRIMITIVES.fontSize[size] * 1.4,
  } : {}

  return (
    <Native.Text style={[theme.typo[variant], sizeOverride, style]} {...props}>
      {children}
    </Native.Text>
  )
}

export default Text
