import { Theme, useTheme } from '@app/shared/theme'
import { useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native'
import Dropdown from '../dropdown/Dropdown.tsx'
import { Icon, IconSymbolName } from '../icon/Icon'
import { DisableableProps, Option, SizeableProps, VariantableProps } from '../types'

interface ButtonProps extends DisableableProps, SizeableProps, VariantableProps {
  label?: string
  icon?: IconSymbolName
  onPress?: () => void
  dense?: boolean
  options?: Option[]
  style?: ViewStyle
}

/**
 * Unified Button component.
 * Supports text labels, icons, or both with dropdown menu functionality.
 */
function Button(props: ButtonProps) {
  const {
    label,
    icon,
    size = 'md',
    onPress,
    variant = 'primary',
    dense = false,
    options,
    disabled = false,
    style,
  } = props

  const { styles, theme } = useTheme(createStyles)
  const [isMenuVisible, setMenuVisible] = useState(false)
  const ref = useRef<View>(null)

  const isIconOnly = !label && icon

  // Size mapping from theme tokens
  const sizeConfig = {
    sm: { padding: theme.tokens.spacing.sm, iconSize: theme.tokens.fontSize.md, fontSize: theme.tokens.fontSize.md },
    md: { padding: theme.tokens.spacing.md, iconSize: theme.tokens.fontSize.lg, fontSize: theme.tokens.fontSize.md },
    lg: { padding: theme.tokens.spacing.lg, iconSize: theme.tokens.fontSize.lg, fontSize: theme.tokens.fontSize.md },
  }[size]

  const handlePress = () => {
    if (options) {
      setMenuVisible(true)
    } else if (onPress) {
      onPress()
    }
  }

  // Dynamic styles based on props
  const buttonStyle = [
    isIconOnly ? styles.iconButton : styles.button,
    variant === 'primary' && (isIconOnly ? styles.iconPrimary : styles.primary),
    variant === 'secondary' && (isIconOnly ? styles.iconSecondary : styles.secondary),
    variant === 'outlined' && (isIconOnly ? styles.iconOutlined : styles.outlined),
    { padding: dense ? sizeConfig.padding / 2 : sizeConfig.padding },
    disabled && styles.disabled,
    style,
  ]

  const textStyle = [
    styles.buttonText,
    variant === 'primary' && styles.textPrimary,
    variant === 'secondary' && styles.textSecondary,
    variant === 'outlined' && styles.textOutlined,
    { fontSize: sizeConfig.fontSize },
    disabled && styles.textDisabled,
  ]

  const iconColor =
    disabled ? theme.colors.onSurface + '50' :
      isIconOnly
        ? variant === 'primary'
          ? theme.colors.background
          : variant === 'secondary'
            ? theme.colors.primary
            : theme.colors.onBackground
        : variant === 'primary'
          ? theme.colors.onPrimary
          : theme.colors.primary

  const iconSize = variant === 'outlined' ? sizeConfig.iconSize + 4 : sizeConfig.iconSize

  return (
    <View ref={ref} id="button-container">
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={buttonStyle}
        hitSlop={isIconOnly ? { top: 8, bottom: 8, left: 8, right: 8 } : undefined}>
        {icon && <Icon name={icon} color={iconColor} size={iconSize} />}
        {label && <Text style={textStyle}>{label}</Text>}
      </Pressable>
      {options && (
        <Dropdown
          anchorRef={ref}
          isVisible={isMenuVisible}
          onClose={() => setMenuVisible(false)}
          options={options}
        />
      )}
    </View>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // Base button styles
    button: {
      borderRadius: 8,
      marginVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    disabled: {
      backgroundColor: theme.colors.background,
    },

    // Variant styles
    primary: {
      backgroundColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: theme.deriveColor(theme.colors.primary, -20),
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.divider,
    },

    // Text styles
    buttonText: {
      textAlign: 'center',
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
    textDisabled: {
      color: theme.colors.onSurface + '40',
    },

    // Icon-only button styles
    iconButton: {
      borderRadius: 50,
      padding: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconPrimary: {
      backgroundColor: theme.colors.primary,
    },
    iconSecondary: {
      backgroundColor: theme.colors.background,
    },
    iconOutlined: {
      backgroundColor: 'transparent',
    },
  })

export default Button
