import useThemeStore from '@app/shared/theme/themeStore'
import { create } from 'zustand'
import { type MapTheme, getMapThemeDefaults } from '../config/mapThemeDefaults'

interface MapThemeStore {
  mapTheme: MapTheme
  updateFromBaseTheme: () => void
}

export type { MapTheme }

export const useMapThemeStore = create<MapThemeStore>(set => ({
  mapTheme: getMapThemeDefaults(),

  updateFromBaseTheme: () => {
    set({ mapTheme: getMapThemeDefaults() })
  },
}))

// Hooks für einfache Nutzung
export const useMapTheme = () => useMapThemeStore(state => state.mapTheme)
export const useUpdateMapTheme = () => useMapThemeStore(state => state.updateFromBaseTheme)

// Automatische Updates bei Theme-Änderungen
useThemeStore.subscribe(() => {
  useMapThemeStore.getState().updateFromBaseTheme()
})
