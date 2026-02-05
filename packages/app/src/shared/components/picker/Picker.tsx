import { useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { Theme, useTheme } from '@app/shared/theme'

import Dropdown from '../dropdown/Dropdown.tsx'
import { ComponentVariant } from '../types.ts'

interface PickerProps {
  /** Available options for selection */
  options: { label: string; value: string }[]
  /** Currently selected value */
  selected: string
  /** Callback when a value is selected */
  onValueChange: (value: string) => void
  /** Visual variant of the picker */
  variant?: ComponentVariant
}

/**
 * Picker component with dropdown menu.
 * Supports primary, secondary, and outlined variants.
 */
function Picker(props: PickerProps) {
  const { options, selected, onValueChange, variant = 'primary' } = props

  const [isMenuVisible, setMenuVisible] = useState(false)
  const buttonRef = useRef<View>(null)
  const { t } = useLocalizationStore()
  const { styles } = useTheme(createStyles)

  const handleOptionSelect = (value: string) => {
    onValueChange(value)
    setMenuVisible(false)
  }

  const buttonStyle = [
    styles.pickerButton,
    variant === 'primary' && styles.pickerPrimary,
    variant === 'secondary' && styles.pickerSecondary,
    variant === 'outlined' && styles.pickerOutlined,
  ]

  const textStyle = [
    styles.pickerButtonText,
    variant === 'primary' && styles.textPrimary,
    variant === 'secondary' && styles.textSecondary,
    variant === 'outlined' && styles.textOutlined,
  ]

  return (
    <View id="picker">
      <Pressable ref={buttonRef} style={buttonStyle} onPress={() => setMenuVisible(true)}>
        <Text style={textStyle}>
          {options.find(option => option.value === selected)?.label || t.common.select}
        </Text>
      </Pressable>
      <Dropdown
        isVisible={isMenuVisible}
        onClose={() => setMenuVisible(false)}
        options={options.map(option => ({
          label: option.label,
          onPress: () => handleOptionSelect(option.value),
        }))}
        anchorRef={buttonRef}
      />
    </View>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    pickerButton: {
      flexGrow: 0,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      minHeight: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pickerPrimary: {
      backgroundColor: theme.colors.primary,
    },
    pickerSecondary: {
      backgroundColor: theme.colors.black,
    },
    pickerOutlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.divider,
    },
    pickerButtonText: {
      fontSize: 14,
    },
    textPrimary: {
      color: theme.colors.onPrimary,
    },
    textSecondary: {
      color: theme.colors.onSurface,
    },
    textOutlined: {
      color: theme.colors.primary,
    },
  })

export default Picker
