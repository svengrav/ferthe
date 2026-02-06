import { useTheme } from '@app/shared/theme'
import { ReactNode } from 'react'
import { View, ViewStyle } from 'react-native'

type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type Direction = 'vertical' | 'horizontal'

interface StackProps {
  children: ReactNode
  spacing?: SpacingSize
  direction?: Direction
  style?: ViewStyle
}

function Stack(props: StackProps) {
  const { children, spacing = 'md', direction = 'vertical', style } = props
  const { theme } = useTheme(() => ({}))

  const gap = theme.tokens.spacing[spacing]
  const flexDirection = direction === 'horizontal' ? 'row' : 'column'

  return (
    <View style={[{ flexDirection, gap }, style]}>
      {children}
    </View>
  )
}

export default Stack
