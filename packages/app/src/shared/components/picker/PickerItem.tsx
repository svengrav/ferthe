import { useVariants } from '@app/shared/theme'
import { Pressable, Text, View } from 'react-native'
import Icon, { IconName } from '../icon/Icon'
import { itemIconVariants, itemTextVariants, itemVariants } from './variants'

interface PickerItemProps {
  label: string
  value: string
  selected?: boolean
  icon?: IconName
  onPress: () => void
}

/**
 * Styled item for Picker dropdown.
 * Uses themedVariants for consistent styling.
 */
function PickerItem(props: PickerItemProps) {
  const { label, selected = false, icon, onPress } = props

  const itemStyle = useVariants(itemVariants, { selected: selected ? 'true' : 'false' })
  const textStyle = useVariants(itemTextVariants, { selected: selected ? 'true' : 'false' })
  const iconStyle = useVariants(itemIconVariants, { selected: selected ? 'true' : 'false' })

  return (
    <Pressable style={itemStyle} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {icon && <Icon name={icon} size='sm' style={iconStyle} />}
        <Text style={textStyle}>{label}</Text>
      </View>
    </Pressable>
  )
}

export default PickerItem
