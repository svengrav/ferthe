import { createTypography, DARK_THEME, LIGHT_THEME, PRIMITIVES, UI_DIMENSIONS } from './theme'
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
    tokens: PRIMITIVES,
    dimensions: UI_DIMENSIONS,
    deriveColor: (color: string, value?: number): string => {
      return themeUtils.deriveColor(mode, color, value)
    },
    opacity: (color: string, alpha?: number): string => {
      return themeUtils.opacity(color, alpha)
    },
  }

  return {
    ...baseTheme,
    typo: createTypography(baseTheme),
  }
}
