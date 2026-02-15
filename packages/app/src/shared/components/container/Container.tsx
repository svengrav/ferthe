import { useTheme } from '@app/shared/theme'
import { ReactNode } from 'react'
import { View, ViewStyle } from 'react-native'

type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ContainerProps {
  children: ReactNode
  padding?: SpacingSize
  style?: ViewStyle
}

function Container(props: ContainerProps) {
  const { children, padding, style } = props
  const { theme } = useTheme(() => ({}))

  const paddingValue = padding ? theme.tokens.spacing[padding] : undefined

  return (
    <View style={[paddingValue && { padding: paddingValue }, style]}>
      {children}
    </View>
  )
}

export default Container
