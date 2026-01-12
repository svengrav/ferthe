import { TextStyle } from 'react-native'

export type ColorScheme = 'light' | 'dark'

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

export interface ThemeConstants {
  HEADER_HEIGHT: number
  NAV_HEIGHT: number
  BOTTOM_SHEET_HEIGHT: number
  OVERLAY_TRANSPARENCY: number
  PAGE_PADDING: number
}

/**
 * Base theme interface that includes constant colors, text styles, and constants.
 */
export interface ThemeBase extends ThemeActions {
  mode: ColorScheme
  colors: Colors
  text: TextTheme
  constants: ThemeConstants
}

/**
 * Main theme interface that combines all theme properties and actions.
 * Also includes calculated styles for layout components.
 */
export interface Theme extends ThemeBase {
  layout: LayoutTheme
}

export interface LayoutTheme {
  header: TextStyle
  title: TextStyle
  section: TextStyle
  subtitle: TextStyle
  textBase: TextStyle
  hint: TextStyle
}

export interface Colors {
  background: string
  surface: string
  primary: string
  primaryVariant: string
  secondary: string
  secondaryVariant: string
  divider: string
  error: string
  disabled: string
  onDisabled: string
  onPrimary: string
  onSecondary: string
  onBackground: string
  onSurface: string
  onError: string
}

interface TextTheme {
  primary: {
    regular: string
    semiBold: string
    bold: string
  }
  secondary: {
    regular: string
    semiBold: string
    bold: string
  }
  size: {
    xs: {
      fontSize: number
      lineHeight: number
    }
    sm: {
      fontSize: number
      lineHeight: number
    }
    md: {
      fontSize: number
      lineHeight: number
    }
    lg: {
      fontSize: number
      lineHeight: number
    }
    xlg: {
      fontSize: number
      lineHeight: number
    }
  }
}
