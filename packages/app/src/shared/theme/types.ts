import { TextStyle } from 'react-native'
import { createTypography, DARK_THEME, LIGHT_THEME, PRIMITIVES, UI_DIMENSIONS } from './theme'

export type ColorScheme = 'light' | 'dark'

/**
 * Colors type derived from theme constants.
 * Ensures both DARK_THEME and LIGHT_THEME have the same structure.
 */
export type Colors = Record<keyof (typeof DARK_THEME & typeof LIGHT_THEME), string>

/**
 * TextTheme type derived from TEXT_THEME constant.
 */
export type TextTheme = ReturnType<typeof createTypography>

/**
 * UI dimensions type derived from UI_DIMENSIONS constant.
 */
export type UiDimensions = typeof UI_DIMENSIONS
export type Tokens = typeof PRIMITIVES

interface ThemeActions {
  /**
   * Derives a color by adjusting its brightness or darkness.
   * @param color The base color to derive from.
   * @param value The amount to adjust the color (positive for lighter, negative for darker).
   * @returns The derived color as a string.
   */
  deriveColor: (color: string, value?: number) => string
  /**
   * Adjusts the opacity of a color.
   * @param color The base color to adjust.
   * @param alpha The opacity level (0-100).
   * @returns The color with the adjusted opacity.
   */
  opacity: (color: string, alpha?: number) => string
}

/**
 * Base theme interface that includes constant colors, text styles, and constants.
 */
export interface ThemeBase extends ThemeActions {
  tokens: Tokens
  mode: ColorScheme
  colors: Colors
  dimensions: UiDimensions
}

/**
 * Main theme interface that combines all theme properties and actions.
 * Also includes calculated styles for typography components.
 */
export interface Theme extends ThemeBase {
  typo: Record<string, TextStyle>
}
