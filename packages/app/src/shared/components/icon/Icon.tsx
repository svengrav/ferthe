// This file is a fallback for using MaterialIcons on Android and web.
import { themedVariants, useVariants } from '@app/shared/theme'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { SymbolWeight } from 'expo-symbols'
import { OpaqueColorValue, StyleProp, TextStyle } from 'react-native'

export type IconSymbolName = keyof typeof MaterialIcons.glyphMap
export type IconCommunitySymbolName = keyof typeof MaterialCommunityIcons.glyphMap

export type IconName = IconSymbolName | IconCommunitySymbolName

type IconSize = 'sm' | 'md' | 'lg'
type IconVariant = 'primary' | 'secondary' | 'outlined'

export interface IconProps {
  name: IconSymbolName | IconCommunitySymbolName
  size?: IconSize
  color?: string | OpaqueColorValue
  style?: StyleProp<TextStyle>
  weight?: SymbolWeight
  variant?: IconVariant
}

// Theme-aware icon variants
const iconVariants = themedVariants<TextStyle>({
  base: {},
  variants: {
    size: {
      sm: (theme) => ({ fontSize: theme.tokens.fontSize.sm }),
      md: (theme) => ({ fontSize: theme.tokens.fontSize.xl }),
      lg: (theme) => ({ fontSize: theme.tokens.fontSize.xl }),
    },
    variant: {
      primary: (theme) => ({ color: theme.colors.primary }),
      secondary: (theme) => ({ color: theme.colors.secondary }),
      outlined: (theme) => ({ color: theme.colors.onBackground }),
    },
  },
  defaultVariants: { size: 'md', variant: 'primary' },
})

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web.
 * Supports themed variants (primary, secondary, outlined) and sizes (sm, md, lg).
 */
const Icon = ({ name, size = 'md', color, style, variant = 'primary' }: IconProps) => {
  const variantStyle = useVariants(iconVariants, { size, variant })
  const iconSize = variantStyle.fontSize as number
  const iconColor = color ?? (variantStyle.color as string)

  if (name in MaterialIcons.glyphMap) {
    return <MaterialIcons color={iconColor} size={iconSize} name={name as IconSymbolName} style={style as StyleProp<TextStyle>} />
  } else if (name in MaterialCommunityIcons.glyphMap) {
    return <MaterialCommunityIcons color={iconColor} size={iconSize} name={name as IconCommunitySymbolName} style={style as StyleProp<TextStyle>} />
  }
}

export { Icon }
export default Icon
