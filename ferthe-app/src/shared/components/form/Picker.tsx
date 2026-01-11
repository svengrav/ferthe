import React, { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { Theme, useThemeStore } from '@app/shared/theme'
import DropdownMenu from './DropdownMenu'

interface CustomPickerProps {
  options: { label: string; value: string }[] // Options for the picker
  selected: string // Currently selected value
  onValueChange: (value: string) => void // Callback when a value is selected
}

const Picker = ({ options, selected: selected, onValueChange }: CustomPickerProps) => {
  const [isMenuVisible, setMenuVisible] = useState(false)
  const buttonRef = useRef<View>(null)
  const { t } = useLocalizationStore()

  const theme = useThemeStore()
  const styles = createStyles(theme)

  const handleOptionSelect = (value: string) => {
    onValueChange(value)
    setMenuVisible(false)
  }

  return (
    <View>
      <TouchableOpacity ref={buttonRef} style={styles.pickerButton} onPress={() => setMenuVisible(true)}>
        <Text style={styles.pickerButtonText}>
          {options.find(option => option.value === selected)?.label || t.common.select}
        </Text>
      </TouchableOpacity>
      <DropdownMenu
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

export default Picker

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    label: {
      fontSize: 8,
      color: theme.colors.onBackground,
    },
    pickerButton: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      minWidth: 40,
      minHeight: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pickerButtonText: {
      color: theme.colors.onBackground,
      fontSize: 14,
    },
  })
