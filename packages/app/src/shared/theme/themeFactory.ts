import { createLayoutTheme } from './layout'
import { DARK_THEME, LIGHT_THEME, TEXT_THEME, THEME_CONSTANTS } from './theme'
import { ColorScheme, Theme, ThemeBase } from './types'
import { themeUtils } from './utils'

export const createTheme = (mode: ColorScheme): Theme => {
  let colors = DARK_THEME
  if (mode === 'light') {
    colors = LIGHT_THEME
  }
  const baseTheme: ThemeBase = {
    mode,
    colors,
    text: TEXT_THEME,
    constants: THEME_CONSTANTS,
    deriveColor: (color: string, value?: number): string => {
      return themeUtils.deriveColor(mode, color, value)
    },
    opacity: (color: string, alpha?: number): string => {
      return themeUtils.opacity(color, alpha)
    },
  }

  const layouts = createLayoutTheme(baseTheme)

  return {
    ...baseTheme,
    layout: layouts,
  }
}
