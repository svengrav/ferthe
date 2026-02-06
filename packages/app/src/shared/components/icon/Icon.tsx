// This file is a fallback for using MaterialIcons on Android and web.
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { OpaqueColorValue, StyleProp, TextStyle } from 'react-native';

export type IconSymbolName = keyof typeof MaterialIcons.glyphMap
export type IconCommunitySymbolName = keyof typeof MaterialCommunityIcons.glyphMap

export interface IconProps {
  name: IconSymbolName | IconCommunitySymbolName
  size?: number
  color?: string | OpaqueColorValue
  style?: StyleProp<TextStyle>
  weight?: SymbolWeight
}

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
const Icon = ({ name, size = 24, color, style }: IconProps) => {
  if (name in MaterialIcons.glyphMap) {
    return <MaterialIcons color={color} size={size} name={name as IconSymbolName} style={style as StyleProp<TextStyle>} />
  } else if (name in MaterialCommunityIcons.glyphMap) {
    return <MaterialCommunityIcons color={color} size={size} name={name as IconCommunitySymbolName} style={style as StyleProp<TextStyle>} />
  }
}

export { Icon };
export default Icon
