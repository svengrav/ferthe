import { ReactNode, useRef, useState } from 'react'
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'

import { useLocalization } from '@app/shared/localization/'
import { Theme, useTheme } from '@app/shared/theme'

import { IconName } from '../icon/Icon.tsx'
import { ComponentSize, ComponentVariant } from '../types'
import PickerButton from './PickerButton.tsx'
import PickerDropdown from './PickerDropdown.tsx'
import PickerItem from './PickerItem.tsx'

const DROPDOWN_MIN_SPACE = 250
const DROPDOWN_APPROXIMATE_HEIGHT = 200

interface PickerItemOption {
  label: string
  value: string
  icon?: IconName
}

interface PickerProps {
  /** Available options for selection */
  options: PickerItemOption[]
  /** Currently selected value */
  selected: string
  /** Callback when a value is selected */
  onValueChange: (value: string) => void
  /** Visual variant of the picker */
  variant?: ComponentVariant
  /** Size of the picker */
  size?: ComponentSize
  /** Custom button renderer */
  renderButton?: (label: string, onPress: () => void) => ReactNode
  /** Custom item renderer */
  renderItem?: (option: PickerItemOption, onPress: () => void, selected: boolean) => ReactNode
}

/**
 * Picker component with dropdown menu.
 * Supports custom rendering via renderButton and renderItem props.
 */
function Picker(props: PickerProps) {
  const { options, selected, onValueChange, variant = 'primary', size = 'md', renderButton, renderItem } = props

  const [isMenuVisible, setMenuVisible] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0 })

  const buttonRef = useRef<View>(null)
  const { height: screenHeight } = useWindowDimensions()
  const { locales } = useLocalization()
  const { styles } = useTheme(createStyles)

  const handleTogglePicker = () => {
    if (!isMenuVisible) {
      buttonRef.current?.measureInWindow((x, y, w, h) => {
        const spaceBelow = screenHeight - (y + h)
        const shouldOpenUp = spaceBelow < DROPDOWN_MIN_SPACE

        setDropdownPosition({
          x,
          y: shouldOpenUp ? y - DROPDOWN_APPROXIMATE_HEIGHT : y + h,
          width: w,
        })
        setMenuVisible(true)
      })
    } else {
      setMenuVisible(false)
    }
  }

  const handleOptionSelect = (value: string) => {
    onValueChange(value)
    setMenuVisible(false)
  }

  const selectedOption = options.find(option => option.value === selected)
  const selectedLabel = selectedOption?.label || locales.common.select
  const selectedIcon = selectedOption?.icon

  return (
    <View ref={buttonRef}>
      {renderButton ? (
        renderButton(selectedLabel, handleTogglePicker)
      ) : (
        <PickerButton
          label={selectedLabel}
          icon={selectedIcon}
          variant={variant}
          size={size}
          onPress={handleTogglePicker}
        />
      )}

      <Modal visible={isMenuVisible} transparent onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuVisible(false)}>
          <PickerDropdown position={dropdownPosition}>
            {options.map(option =>
              renderItem ? (
                <View key={option.value}>
                  {renderItem(option, () => handleOptionSelect(option.value), option.value === selected)}
                </View>
              ) : (
                <PickerItem
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  selected={option.value === selected}
                  onPress={() => handleOptionSelect(option.value)}
                  icon={option.icon}
                />
              )
            )}
          </PickerDropdown>
        </Pressable>
      </Modal>
    </View>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
    },
  })

export default Picker
