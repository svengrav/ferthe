import { useTheme } from '@app/shared/theme'
import { ReactNode } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'

type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type Direction = 'vertical' | 'horizontal'
type Align = 'start' | 'center' | 'end' | 'stretch'
type Justify = 'start' | 'center' | 'end' | 'between' | 'around'

const alignMap: Record<Align, ViewStyle['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
}

const justifyMap: Record<Justify, ViewStyle['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
}

interface StackProps {
  children: ReactNode
  spacing?: SpacingSize
  direction?: Direction
  align?: Align
  justify?: Justify
  wrap?: boolean
  flex?: boolean
  testID?: string
  id?: string
  style?: StyleProp<ViewStyle>
}

function Stack(props: StackProps) {
  const { children, spacing = 'md', direction = 'vertical', align, justify, wrap, flex, testID, id, style } = props
  const { theme } = useTheme(() => ({}))

  const gap = theme.tokens.spacing[spacing]
  const flexDirection = direction === 'horizontal' ? 'row' : 'column'

  return (
    <View
      testID={testID}
      id={id}
      style={[
        {
          flexDirection,
          gap,
          ...(align && { alignItems: alignMap[align] }),
          ...(justify && { justifyContent: justifyMap[justify] }),
          ...(wrap && { flexWrap: 'wrap' }),
          ...(flex && { flex: 1 }),
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

export default Stack
