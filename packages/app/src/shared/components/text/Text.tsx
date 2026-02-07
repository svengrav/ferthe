import { useThemeStore } from '@app/shared/theme'
import { PRIMITIVES } from '@app/shared/theme/theme'
import { TextTheme, Tokens } from '@app/shared/theme/types'
import * as Native from 'react-native'
import { AlignableProps } from '../types'

type TextVariant = keyof TextTheme
type TextSize = keyof Tokens["fontSize"]

interface TextProps extends Native.TextProps, AlignableProps {
  size?: TextSize
  variant?: TextVariant
}

const Text = ({ style, children, variant = 'body', size, align, ...props }: TextProps) => {
  const theme = useThemeStore()

  const sizeOverride = size ? {
    fontSize: PRIMITIVES.fontSize[size],
    lineHeight: PRIMITIVES.fontSize[size] * 1.4,
  } : {}

  const alignOverride = align ? { textAlign: align } : {}

  return (
    <Native.Text style={[theme.typo[variant], sizeOverride, alignOverride, style]} {...props}>
      {children}
    </Native.Text>
  )
}

export default Text
