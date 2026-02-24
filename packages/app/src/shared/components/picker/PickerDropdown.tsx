import { Theme, useTheme } from '@app/shared/theme'
import { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

interface PickerDropdownProps {
  children: ReactNode
  position: { x: number; y: number; width: number }
}

/**
 * Dropdown container for Picker items.
 * Handles absolute positioning for Modal rendering.
 */
function PickerDropdown(props: PickerDropdownProps) {
  const { children, position } = props
  const { styles } = useTheme(createStyles)

  return (
    <View
      style={[
        styles.dropdown,
        {
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: position.width,
        },
      ]}
    >
      {children}
    </View>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    dropdown: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  })

export default PickerDropdown
