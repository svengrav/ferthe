import { Colors, ThemeConstants } from './types'

/**
 * This file defines the color themes, text styles, map styles, and constants used throughout the application.
 * It includes both dark and light themes, typography settings, map styles, and various design tokens
 */

export const DARK_THEME: Colors = {
  background: 'rgb(18, 18, 30)',
  onBackground: '#FFFFFF',
  primary: '#ffffff',
  secondary: '#696969',
  divider: '#7a7a7a38',
  surface: 'rgb(32, 32, 43)',
  disabled: '#7a7a7a',
  onDisabled: '#535353',
  primaryVariant: '',
  secondaryVariant: '',
  error: '#dd4c4c',
  onPrimary: '',
  onSecondary: '#7a7a7a',
  onSurface: '#dddddd',
  onError: '#ffffff',
}

export const LIGHT_THEME: Colors = {
  background: '#F5F5F5',
  onBackground: '#121214',
  primary: '#000000',
  secondary: '#dadada',
  divider: '#E0E0E0',
  surface: '#FFFFFF',
  disabled: '#b3b3b3',
  onDisabled: '#888888',
  primaryVariant: '',
  secondaryVariant: '',
  error: '#dd4c4c',
  onPrimary: '#fff',
  onSecondary: '#121214',
  onSurface: '#121214',
  onError: '#ffffff',
}

export const TEXT_THEME = {
  primary: {
    regular: 'Inter_400Regular',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  secondary: {
    regular: 'Merriweather_400Regular',
    semiBold: 'Merriweather_600SemiBold',
    bold: 'Merriweather_700Bold',
  },
  size: {
    xs: {
      fontSize: 12,
      lineHeight: 16,
    },
    sm: {
      fontSize: 14,
      lineHeight: 20,
    },
    md: {
      fontSize: 15,
      lineHeight: 24,
    },
    lg: {
      fontSize: 18,
      lineHeight: 24,
    },
    xlg: {
      fontSize: 20,
      lineHeight: 28,
    },
  },
}

export const THEME_CONSTANTS: ThemeConstants = {
  HEADER_HEIGHT: 56,
  NAV_HEIGHT: 56,
  BOTTOM_SHEET_HEIGHT: 80,
  OVERLAY_TRANSPARENCY: 0.5,
  PAGE_PADDING: 16,
}

export const DESIGN_TOKENS = {
  textSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  typography: {
    heading1: { fontSize: 24, lineHeight: 32, fontWeight: 'bold' },
    heading2: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
    body: { fontSize: 16, lineHeight: 24 },
    caption: { fontSize: 12, lineHeight: 16 },
  },
  shadows: {
    sm: { shadowOffset: { width: 0, height: 1 }, shadowRadius: 2 },
    md: { shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  },
}
