import { StyleSheet } from 'react-native'
import { create } from 'zustand'
import { createTheme } from './themeFactory'
import { ColorScheme, Theme } from './types'

const useThemeStore = create<Theme>(set => {
  // Initial theme build
  const initialTheme = createTheme('dark')
  return {
    ...initialTheme,
    setColorScheme: (mode: ColorScheme) => {
      set(mode === 'dark' ? createTheme('dark') : createTheme('light'))
    },
  }
})
export type ThemedStyle<T> = (theme: Theme) => T

export function createThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(styleFn: ThemedStyle<T>) {
  return (theme: Theme) => StyleSheet.create(styleFn(theme))
}

export function setTheme(mode: ColorScheme) {
  useThemeStore.setState({
    ...createTheme(mode),
  })
}

// React hook to use themed styles in components
export function useThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(styleFn: ThemedStyle<T>) {
  const theme = useThemeStore()
  return {
    theme: theme,
    styles: createThemedStyles(styleFn)(theme),
  }
}

export default useThemeStore
