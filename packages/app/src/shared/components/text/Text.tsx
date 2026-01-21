import { Theme, useThemeStore } from '@app/shared/theme'
import { createLayoutTheme } from '@app/shared/theme/layout'
import * as Native from 'react-native'

type TextVariant = 'body' | 'caption' | 'heading' | 'title' | 'section' | 'hint' | 'subtitle'

interface TextProps extends Native.TextProps {
  variant?: TextVariant
}

const Text = ({ style, children, variant = 'body', ...props }: TextProps) => {
  const theme = useThemeStore() as Theme
  const layout = createLayoutTheme(theme)
  const variantStyle = getVariantStyle(layout, variant)

  return (
    <Native.Text style={[variantStyle, style]} {...props}>
      {children}
    </Native.Text>
  )
}

const getVariantStyle = (layout: ReturnType<typeof createLayoutTheme>, variant: TextVariant) => {
  switch (variant) {
    case 'heading':
      return layout.header
    case 'title':
      return layout.title
    case 'section':
      return layout.section
    case 'caption':
      return layout.hint
    case 'hint':
      return layout.hint
    case 'subtitle':
      return layout.subtitle
    case 'body':
    default:
      return layout.textBase
  }
}

export default Text
