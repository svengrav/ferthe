import { ThemeBase } from './types'

/**
 * This file defines the color themes, text styles, map styles, and constants used throughout the application.
 * It includes both dark and light themes, typography settings, map styles, and various design tokens
 */

export const DARK_THEME = {
  white: '#FFFFFF',
  black: '#000000',
  background: '#12121e',
  onBackground: '#FFFFFF',
  primary: '#ffffff',
  secondary: '#696969',
  divider: '#7a7a7a38',
  surface: '#161623',
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

export const LIGHT_THEME = {
  white: '#FFFFFF',
  black: '#000000',
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

export const UI_DIMENSIONS = {
  HEADER_HEIGHT: 60,
  NAV_HEIGHT: 56,
  BOTTOM_SHEET_HEIGHT: 80,
  OVERLAY_TRANSPARENCY: 0.5,
  PAGE_PADDING: 16,
} as const

export const PRIMITIVES = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  shadows: {
    sm: { shadowOffset: { width: 0, height: 1 }, shadowRadius: 2 },
    md: { shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  },
  fontSize: {
    sm: 12,
    md: 16,
    lg: 18,
  },
} as const

/**
 * Creates complete typography styles with theme-dependent values (colors, fonts).
 * Static typography properties come from TYPOGRAPHY_PRESETS, dynamic values are added here.
 */
export const createTypography = (theme: ThemeBase) => {
  return {
    heading: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600' as const,
      fontFamily: 'Inter_600SemiBold',
      color: theme.colors.onBackground,
      alignSelf: 'center' as const,
      paddingVertical: 12,
    },
    title: {
      fontSize: 15,
      lineHeight: 18,
      fontWeight: '600' as const,
      fontFamily: 'Inter_600SemiBold',
      color: theme.colors.onBackground,
      marginBottom: 4,
    },
    section: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '400' as const,
      fontFamily: 'Inter_400Regular',
      color: theme.colors.onBackground,
      paddingVertical: 8,
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '400' as const,
      fontFamily: 'Inter_400Regular',
      color: theme.colors.onSurface,
    },
    body: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
      fontFamily: 'Inter_400Regular',
      color: theme.colors.onSurface,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
      fontFamily: 'Inter_400Regular',
      color: theme.deriveColor(theme.colors.onSurface, 0.2),
    },
    hint: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: theme.deriveColor(theme.colors.onSurface, 0.5),
    },
    label: {
      fontSize: 14,
      fontWeight: '400' as const,
      fontFamily: 'Inter_400Regular',
      color: theme.colors.onSurface,
      paddingBottom: 8,
    },
  }
}
