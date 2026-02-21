import { themedVariants, useVariants } from '@app/shared/theme/variants'
import { StyleProp, Text, TouchableOpacity, View, ViewStyle } from 'react-native'
import Icon, { IconName } from '../icon/Icon'
import { ComponentSize, ComponentVariant, DisableableProps } from '../types'

interface ChipProps extends DisableableProps {
  label: string
  onPress?: () => void
  variant?: ComponentVariant
  size?: ComponentSize
  style?: StyleProp<ViewStyle>
  icon?: IconName
}

function Chip({ label, icon, onPress, variant = 'primary', size = 'md', disabled = false, style }: ChipProps) {
  const chip = useVariants(chipStyle, { variant, size })
  const chipText = useVariants(chipTextStyle, { variant, size })
  const chipIcon = useVariants(chipIconStyle, { variant, size })
  const ChipContainer = onPress ? TouchableOpacity : View

  return (
    <ChipContainer style={[chip, style]} onPress={onPress} disabled={disabled} >
      {icon && <Icon name={icon} style={chipIcon} />}
      <Text style={chipText}>{label}</Text>
    </ChipContainer>
  )
}

export default Chip

const chipStyle = themedVariants({
  base: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    borderRadius: 16,
  },
  variants: {
    variant: {
      primary: (t) => ({ backgroundColor: t.colors.onSurface, borderWidth: 0 }),
      secondary: (t) => ({ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.onSurface }),
      outlined: (t) => ({ backgroundColor: 'transparent', borderWidth: 1, borderColor: t.colors.onSurface }),
    },
    size: {
      sm: { paddingVertical: 2, paddingHorizontal: 8 },
      md: { paddingVertical: 4, paddingHorizontal: 12 },
      lg: { paddingVertical: 8, paddingHorizontal: 20 },
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
})

const chipIconStyle = themedVariants({
  base: {
    marginRight: 4,
    alignSelf: 'center'
  },
  variants: {
    variant: {
      primary: (t) => ({ color: t.colors.surface }),
      secondary: (t) => ({ color: t.colors.onSurface }),
      outlined: (t) => ({ color: t.colors.onSurface }),
    },
    size: {
      sm: { fontSize: 12 },
      md: { fontSize: 14 },
      lg: { fontSize: 18 },
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
})

const chipTextStyle = themedVariants({
  variants: {
    variant: {
      primary: (t) => ({ color: t.colors.surface }),
      secondary: (t) => ({ color: t.colors.onSurface }),
      outlined: (t) => ({ color: t.colors.onSurface }),
    },
    size: {
      sm: { fontSize: 12 },
      md: { fontSize: 14 },
      lg: { fontSize: 18 },
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
})