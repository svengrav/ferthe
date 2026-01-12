import Color from 'color'
import { ColorScheme } from './types'

const deriveColor = (mode: ColorScheme, color: string, strength: number = 0.5) => {
  const textColor = Color(color)
  return mode === 'dark' ? textColor.darken(strength).hex() : textColor.lighten(strength * 10).hex()
}

const opacity = (color: string, alpha: number = 0.5) => {
  return Color(color).alpha(alpha).rgb().string()
}

export const themeUtils = {
  deriveColor,
  opacity,
}
