import { useThemeStore } from '@app/shared/theme'
import { PRIMITIVES } from '@app/shared/theme/theme'
import { TextTheme } from '@app/shared/theme/types'
import * as Native from 'react-native'

type TextVariant = keyof TextTheme
type TextSize = 'sm' | 'md' | 'lg'

interface TextProps extends Native.TextProps {
  variant?: TextVariant
  size?: TextSize
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
