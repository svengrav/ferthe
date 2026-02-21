import Text from '@app/shared/components/text/Text'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import React, { useEffect, useState } from 'react'
import { Dimensions, Modal, TouchableOpacity, View } from 'react-native'
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
 * Hook to calculate dropdown menu position based on anchor element.
 * Centers the menu under the anchor when there is enough space,
 * otherwise aligns to the closer screen edge.
 */
const useMenuPosition = (
  anchorRef: React.RefObject<View | null>,
  isVisible: boolean,
  optionsCount: number
) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (anchorRef?.current && isVisible) {
      anchorRef.current.measure((_x, _y, width, height, pageX, pageY) => {
        const screenWidth = Dimensions.get('window').width
        const screenHeight = Dimensions.get('window').height
        const menuHeight = optionsCount * MENU_ITEM_HEIGHT

        // Center menu horizontally under anchor, then clamp to screen bounds
        const centeredX = pageX + width / 2 - MENU_WIDTH / 2
        const adjustedX = Math.max(
          SCREEN_MARGIN,
          Math.min(centeredX, screenWidth - MENU_WIDTH - SCREEN_MARGIN)
        )

        // Place below anchor; flip above if not enough space
        let adjustedY = pageY + height
        if (pageY + height + menuHeight > screenHeight) {
          adjustedY = pageY - menuHeight
        }
        adjustedY = Math.max(SCREEN_MARGIN, adjustedY)

        setPosition({ x: adjustedX, y: adjustedY })
      })
    }
  }, [isVisible, optionsCount])

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
function Dropdown({ isVisible, onClose, options, anchorRef }: DropdownMenuProps) {
  const { styles } = useTheme(useStyles)
  const position = useMenuPosition(anchorRef, isVisible, options.length)

  if (!styles) return null

  // Only render menu once position is measured to avoid blink at (0,0)
  const menuPositionStyles = position
    ? { top: position.y, left: position.x }
    : { opacity: 0 as const }

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
              <Text >{option.label}</Text>
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

  },
}))

export default Dropdown
