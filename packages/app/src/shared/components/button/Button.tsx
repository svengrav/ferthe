import { Theme, useThemeStore } from '@app/shared/theme'
import { useRef, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native'
import DropdownMenu from '../form/DropdownMenu'
import { Icon, IconProps } from '../icon/Icon'
import { Option } from '../types'

type ButtonVariant = 'primary' | 'outlined' | 'secondary'

interface ButtonProps {
  label: string
  onPress?: () => void
  variant?: ButtonVariant
  dense?: boolean
  options?: Option[]
  disabled?: boolean
  align?: 'flex-start' | 'center' | 'flex-end' | undefined
  style?: ViewStyle | undefined
}

const Button = ({ label, dense, onPress, variant = 'primary', options, disabled, align = undefined, style }: ButtonProps) => {
  const theme = useThemeStore()
  const styles = createButtonStyles(theme, variant, dense || false, disabled)
  const [isMenuVisible, setMenuVisible] = useState(false)
  const ref = useRef<View>(null)

  const handlePress = disabled ? undefined : (options ? () => setMenuVisible(true) : onPress)

  return (
    <View style={[styles.button, { alignSelf: align }, style]} ref={ref}>
      <TouchableOpacity onPress={handlePress} disabled={disabled}>
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
      {options && (
        <DropdownMenu
          anchorRef={ref}
          isVisible={isMenuVisible}
          onClose={() => setMenuVisible(false)}
          options={options}
        />
      )}
    </View>
  )
}

const createButtonStyles = (theme: Theme, variant: ButtonVariant, dense: boolean, disabled?: boolean) => {
  const fontSize = dense ? 12 : 16
  const padding = dense ? 6 : 8

  switch (variant) {
    case 'primary':
      return StyleSheet.create({
        button: {
          backgroundColor: disabled ? theme.deriveColor(theme.colors.primary, 0.7) : theme.colors.primary,
          padding: padding,
          borderRadius: 8,
          marginVertical: 8,
          opacity: disabled ? 0.5 : 1,
        },
        buttonText: {
          color: disabled ? theme.deriveColor(theme.colors.primary, 0.2) : theme.colors.onPrimary,
          fontSize: dense ? 12 : 16,
          textAlign: 'center',
        },
        disabledText: {
          color: theme.colors.onSurface + '50',
        },
      })

    case 'secondary':
      return StyleSheet.create({
        button: {
          padding: padding,
          borderRadius: 8,
          marginVertical: 8,
          opacity: disabled ? 0.5 : 1,
        },
        buttonText: {
          color: disabled ? theme.colors.onSurface + '50' : theme.colors.onSurface,
          fontSize: fontSize,
          textAlign: 'center',
        },
        disabledText: {
          color: theme.colors.onSurface + '50',
        },
      })

    case 'outlined':
      return StyleSheet.create({
        button: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? theme.colors.onSurface + '30' : theme.colors.primary,
          padding: padding,
          borderRadius: 8,
          marginVertical: 8,
          opacity: disabled ? 0.5 : 1,
        },
        buttonText: {
          color: disabled ? theme.colors.onSurface + '50' : theme.colors.primary,
          fontSize: fontSize,
          textAlign: 'center',
        },
        disabledText: {
          color: theme.colors.onSurface + '50',
        },
      })
  }
}
interface IconButtonProps extends IconProps {
  disabled?: boolean
  onPress?: () => void
  options?: Option[]
  variant?: ButtonVariant
}

export const IconButton = ({ onPress, options, variant = 'primary', style, disabled, ...props }: IconButtonProps) => {
  const theme = useThemeStore()
  const styles = createIconButtonStyles(theme, variant)
  const [isMenuVisible, setMenuVisible] = useState(false)
  const ref = useRef<View>(null)

  return (
    <>
      <View>
        <TouchableOpacity
          disabled={disabled}
          style={[styles.iconButton, { height: 22, width: 22 }, style]}
          onPress={options ? () => setMenuVisible(true) : onPress}
          ref={ref}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon color={styles.iconButton.color} size={22} {...props} />
        </TouchableOpacity>
        {options && (
          <DropdownMenu
            anchorRef={ref}
            isVisible={isMenuVisible}
            onClose={() => setMenuVisible(false)}
            options={options}
          />
        )}
      </View>
    </>
  )
}

const createIconButtonStyles = (theme: Theme, variant: ButtonVariant) => {
  switch (variant) {
    case 'primary':
      return StyleSheet.create({
        iconButton: {
          backgroundColor: theme.colors.primary,
          color: theme.colors.background,
          borderRadius: 50,
          marginVertical: 0,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-start',
          minWidth: 0,
          minHeight: 0,
        },
      })
    case 'outlined':
      return StyleSheet.create({
        iconButton: {
          backgroundColor: 'transparent',
          color: theme.colors.onBackground,
          borderRadius: 50,
          marginVertical: 0,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-start',
          minWidth: 0,
          minHeight: 0,
        },
      })
    default:
      throw new Error(`Unknown variant: ${variant}`)
  }
}

export default Button
