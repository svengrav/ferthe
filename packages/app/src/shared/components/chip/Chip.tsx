import { Theme, useThemeStore } from '@app/shared/theme'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ComponentSize, ComponentVariant, DisableableProps } from '../types'

interface ChipProps extends DisableableProps {
  label: string
  onPress?: () => void
  variant?: ComponentVariant
  size?: ComponentSize
}

function Chip({ label, onPress, variant = 'primary', size = 'md', disabled = false }: ChipProps) {
  const theme = useThemeStore()
  const styles = createStyles(theme, variant, size)

  const ChipContainer = onPress ? TouchableOpacity : View

  return (
    <ChipContainer style={styles.chip} onPress={onPress} disabled={disabled}>
      <Text style={styles.chipText}>{label}</Text>
    </ChipContainer>
  )
}

export default Chip

const createStyles = (
  theme: Theme,
  variant: ComponentVariant,
  size: ComponentSize
) => {
  // Variant styles
  let backgroundColor, borderColor, textColor
  switch (variant) {
    case 'secondary':
      backgroundColor = theme.colors.surface
      borderColor = theme.colors.onSurface
      textColor = theme.colors.onSurface
      break
    case 'outlined':
      backgroundColor = 'transparent'
      borderColor = theme.colors.onSurface
      textColor = theme.colors.onSurface
      break
    case 'primary':
    default:
      backgroundColor = theme.colors.onSurface
      borderColor = 'transparent'
      textColor = theme.colors.surface
      break
  }

  // Size styles
  let paddingVertical, paddingHorizontal, fontSize
  switch (size) {
    case 'sm':
      paddingVertical = 2
      paddingHorizontal = 8
      fontSize = 12
      break
    case 'lg':
      paddingVertical = 8
      paddingHorizontal = 20
      fontSize = 18
      break
    case 'md':
    default:
      paddingVertical = 4
      paddingHorizontal = 12
      fontSize = 14
      break
  }

  return StyleSheet.create({
    chip: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      backgroundColor,
      borderRadius: 16,
      paddingVertical,
      paddingHorizontal,
      borderWidth: variant === 'outlined' ? 1 : 0,
      borderColor,
    },
    chipText: {
      color: textColor,
      fontSize,
    },
  })
}
