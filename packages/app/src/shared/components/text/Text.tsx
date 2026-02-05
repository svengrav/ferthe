import { useThemeStore } from '@app/shared/theme'
import { PRIMITIVES } from '@app/shared/theme/theme'
import { TextTheme } from '@app/shared/theme/types'
import * as Native from 'react-native'
import { AlignableProps, SizeableProps } from '../types'

type TextVariant = keyof TextTheme

interface TextProps extends Native.TextProps, SizeableProps, AlignableProps {
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
