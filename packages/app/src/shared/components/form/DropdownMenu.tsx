import { createThemedStyles } from '@app/shared/theme/useThemeStore'
import { useApp } from '@app/shared/useApp'
import React, { useEffect, useState } from 'react'
import { Dimensions, Modal, Text, TouchableOpacity, View } from 'react-native'
import { Option } from '../types'

const MENU_WIDTH = 150
const MENU_ITEM_HEIGHT = 50
const SCREEN_MARGIN = 10
const BACKDROP_OPACITY = 0.5
const BORDER_RADIUS = 4
const MENU_PADDING = 4
const OPTION_PADDING = 8
const FONT_SIZE = 14

/**
 * Hook to calculate dropdown menu position based on anchor element
 */
const useMenuPosition = (
  anchorRef: React.RefObject<View | null>,
  isVisible: boolean,
  optionsCount: number
) => {
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    if (anchorRef?.current && isVisible) {
      anchorRef.current.measure((x, y, width, height, pageX, pageY) => {
        const screenWidth = Dimensions.get('window').width
        const screenHeight = Dimensions.get('window').height
        const menuHeight = optionsCount * MENU_ITEM_HEIGHT

        // Calculate x position to keep menu within screen bounds
        let adjustedX = pageX
        if (pageX + MENU_WIDTH > screenWidth) {
          adjustedX = screenWidth - MENU_WIDTH - SCREEN_MARGIN
        } else if (pageX < 0) {
          adjustedX = SCREEN_MARGIN
        }

        // Calculate y position to keep menu within screen bounds
        let adjustedY = pageY + height
        if (pageY + height + menuHeight > screenHeight) {
          adjustedY = pageY - menuHeight
        }
        if (adjustedY < 0) {
          adjustedY = SCREEN_MARGIN
        }

        setPosition({ x: adjustedX, y: adjustedY })
      })
    }
  }, [anchorRef, isVisible, optionsCount])

  return position
}

interface DropdownMenuProps {
  isVisible: boolean
  onClose: () => void
  options: Option[]
  anchorRef: React.RefObject<View | null>
}

/**
 * Dropdown menu component that displays a list of options positioned relative to an anchor element.
 * Features automatic positioning to stay within screen bounds and smooth fade animation.
 */
function DropdownMenu({ isVisible, onClose, options, anchorRef }: DropdownMenuProps) {
  const { styles } = useApp(useStyles)
  const position = useMenuPosition(anchorRef, isVisible, options.length)

  if (!styles) return null

  // Dynamic styles that depend on position
  const menuPositionStyles = {
    top: position.y,
    left: position.x,
  }

  const handleOptionPress = (option: Option) => {
    option.onPress?.()
    onClose()
  }

  const isLastOption = (index: number) => index === options.length - 1

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
      animationType='fade'
    >
      <TouchableOpacity style={styles.backdrop} onPress={onClose}>
        <View style={[styles.menu, menuPositionStyles]}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuOption,
                isLastOption(index) && styles.lastMenuOption
              ]}
              onPress={() => handleOptionPress(option)}
            >
              <Text style={styles.menuOptionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const useStyles = createThemedStyles(theme => ({
  backdrop: {
    flex: 1,
    backgroundColor: `rgba(0, 0, 0, ${BACKDROP_OPACITY})`,
  },
  menu: {
    position: 'absolute',
    backgroundColor: theme.colors.surface,
    borderRadius: BORDER_RADIUS,
    padding: MENU_PADDING,
    width: MENU_WIDTH,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuOption: {
    padding: OPTION_PADDING,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  lastMenuOption: {
    borderBottomWidth: 0,
  },
  menuOptionText: {
    fontSize: FONT_SIZE,
    color: theme.colors.onBackground,
    fontFamily: theme.text.primary.regular,
  },
}))

export default DropdownMenu
