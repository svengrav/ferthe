import { useThemeStore, Theme } from '@app/shared/theme'
import { StyleSheet } from 'react-native'
import { View, TouchableOpacity } from 'react-native'
import { Text } from 'react-native'

interface ChipProps {
  label: string
  onPress?: () => void
  variant?: 'primary' | 'secondary' | 'outlined'
  size?: 'small' | 'medium' | 'large'
}

function Chip({ label, onPress, variant = 'primary', size = 'medium' }: ChipProps) {
  const theme = useThemeStore()
  const styles = createStyles(theme, variant, size)

  const ChipContainer = onPress ? TouchableOpacity : View

  return (
    <ChipContainer style={styles.chip} onPress={onPress}>
      <Text style={styles.chipText}>{label}</Text>
    </ChipContainer>
  )
}

export default Chip

const createStyles = (
  theme: Theme,
  variant: 'primary' | 'secondary' | 'outlined',
  size: 'small' | 'medium' | 'large'
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
    case 'small':
      paddingVertical = 2
      paddingHorizontal = 8
      fontSize = theme.text.size.xs.fontSize ?? 12
      break
    case 'large':
      paddingVertical = 8
      paddingHorizontal = 20
      fontSize = theme.text.size.md.fontSize ?? 18
      break
    case 'medium':
    default:
      paddingVertical = 4
      paddingHorizontal = 12
      fontSize = theme.text.size.sm.fontSize ?? 14
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
      ...theme.text.size.sm,
      fontFamily: theme.text.primary.regular,
      color: textColor,
      fontSize,
    },
  })
}
