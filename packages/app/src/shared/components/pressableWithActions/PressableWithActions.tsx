import Dropdown from '@app/shared/components/dropdown/Dropdown'
import { Option } from '@app/shared/components/types'
import { ReactNode, useRef, useState } from 'react'
import { Pressable, PressableProps, StyleProp, View, ViewStyle } from 'react-native'

interface PressableWithActionsProps {
  onPress?: () => void
  actions: Option[]
  children: ReactNode
  style?: StyleProp<ViewStyle>
  pressableProps?: Omit<PressableProps, 'onPress' | 'onLongPress' | 'style' | 'ref'>
}

/**
 * Pressable component with dropdown menu on long press.
 * Combines Pressable + Dropdown pattern into reusable component.
 */
function PressableWithActions({
  onPress,
  actions,
  children,
  style,
  pressableProps,
}: PressableWithActionsProps) {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false)
  const anchorRef = useRef<View>(null)

  const handleLongPress = () => {
    setIsDropdownVisible(true)
  }

  return (
    <>
      <Pressable
        ref={anchorRef}
        onPress={onPress}
        onLongPress={handleLongPress}
        style={style}
        {...pressableProps}
      >
        {children}
      </Pressable>
      <Dropdown
        isVisible={isDropdownVisible}
        onClose={() => setIsDropdownVisible(false)}
        options={actions}
        anchorRef={anchorRef}
      />
    </>
  )
}

export default PressableWithActions
