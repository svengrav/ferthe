import { Text } from '@app/shared/components/'
import { Theme, useThemeStore } from '@app/shared/theme'
import { Pressable, StyleSheet, View } from 'react-native'

interface CheckboxProps {
  checked: boolean
  onPress: () => void
  label?: string
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  variant?: 'primary' | 'secondary'
}

export const Checkbox = ({
  checked,
  onPress,
  label,
  disabled = false,
  size = 'medium',
  variant = 'primary'
}: CheckboxProps) => {
  const theme = useThemeStore()
  const styles = createStyles(theme, checked, disabled, size, variant)
  return (
    <Pressable
      style={styles.container}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
    >
      <View style={styles.checkbox}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      {label && <Text>{label}</Text>}
    </Pressable>
  )
}

const createStyles = (theme: Theme, checked: boolean, disabled: boolean, size: 'small' | 'medium' | 'large', variant: 'primary' | 'secondary') =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      opacity: disabled ? 0.5 : 1,
      gap: theme.tokens.spacing.md
    },
    checkbox: {
      width: 16,
      height: 16,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: checked
        ? (variant === 'primary' ? theme.colors.primary : theme.colors.secondary)
        : theme.colors.onSurface + '40',
      backgroundColor: checked
        ? (variant === 'primary' ? theme.colors.primary : theme.colors.secondary)
        : 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmark: {
      color: checked ? theme.colors.onPrimary || theme.colors.background : 'transparent',
      fontSize: 12,
      fontWeight: 'bold',
      lineHeight: 12,
    },
  })

