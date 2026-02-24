import { useVariants } from '@app/shared/theme'
import { Pressable, Text, View } from 'react-native'
import Icon, { IconName } from '../icon/Icon'
import { ComponentSize, ComponentVariant } from '../types'
import { buttonIconVariants, buttonTextVariants, buttonVariants } from './variants'

interface PickerButtonProps {
  label: string
  icon?: IconName
  variant?: ComponentVariant
  size?: ComponentSize
  onPress: () => void
  disabled?: boolean
}

/**
 * Styled button for Picker component.
 * Uses themedVariants for consistent styling.
 */
function PickerButton(props: PickerButtonProps) {
  const { label, icon, variant = 'primary', size = 'md', onPress, disabled = false } = props

  const buttonStyle = useVariants(buttonVariants, { variant, size })
  const textStyle = useVariants(buttonTextVariants, { variant, size })
  const iconStyle = useVariants(buttonIconVariants, { variant })

  return (
    <Pressable style={buttonStyle} onPress={onPress} disabled={disabled}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {icon && <Icon name={icon} size='sm' style={iconStyle} />}
        <Text style={textStyle}>{label}</Text>
      </View>
    </Pressable>
  )
}

export default PickerButton
