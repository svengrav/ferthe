import { useTheme } from '@app/shared/theme'
import { StyleProp, View, ViewStyle } from 'react-native'

type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface SpacerProps {
  size?: SpacingSize
  horizontal?: boolean
  style?: StyleProp<ViewStyle>
}

function Spacer({ size = 'md', horizontal = false, style }: SpacerProps) {
  const { theme } = useTheme(() => ({}))
  const value = theme.tokens.spacing[size]
  return <View style={[horizontal ? { width: value } : { height: value }, style]} />
}

export default Spacer
