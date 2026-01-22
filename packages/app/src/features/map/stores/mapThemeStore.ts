import useThemeStore from '@app/shared/theme/themeStore'
import { create } from 'zustand'

interface MapThemeStore {
  mapTheme: MapTheme
  updateFromBaseTheme: () => void
}

export interface MapTheme {
  radius: { fill: string; strokeColor: string; strokeWidth: number }
  device: { fill: string; strokeColor: string; strokeWidth: number }
  spot: { fill: string; strokeColor: string; strokeWidth: number; size: number }
  discovery: { fill: string; strokeColor: string; strokeWidth: number }
  clue: { fill: string; strokeColor: string; strokeWidth: number }
  trail: { strokeColor: string; strokeWidth: number; strokeDash?: number[] }
  snap: { strokeColor: string; strokeWidth: number; strokeDash?: number[] }
  scanner: { strokeColor: string; fill: string; strokeWidth: number }
  compass: { color: string; fontSize: number }
  center: { fill: string }
}

const createMapThemeFromBase = (): MapTheme => {
  const baseTheme = useThemeStore.getState()

  return {
    radius: {
      strokeColor: '#000',
      fill: 'rgba(0, 0, 0, 0.2)', // Semi-transparent white
      strokeWidth: 2,
    },
    device: {
      strokeColor: '#fa1c4c',
      fill: '#fa1c4c',
      strokeWidth: 1.5,
    },
    spot: {
      strokeColor: baseTheme.colors.primary,
      fill: baseTheme.colors.background,
      strokeWidth: 1.5,
      size: 20, // Default size for spot markers
    },
    discovery: {
      strokeColor: baseTheme.colors.primary,
      fill: baseTheme.colors.background,
      strokeWidth: 1.5,
    },
    clue: {
      strokeColor: baseTheme.colors.primary,
      fill: baseTheme.colors.background,
      strokeWidth: 1.5,
    },
    trail: {
      strokeColor: baseTheme.opacity(baseTheme.colors.onSurface, 80),
      strokeWidth: 1.5,
    },
    snap: {
      strokeColor: '#fa1c4c',
      strokeWidth: 1.5,
    },
    scanner: {
      strokeColor: '#fa1c4c',
      fill: '#fa1c4c59',
      strokeWidth: 1,
    },
    compass: {
      color: baseTheme.colors.onSurface,
      fontSize: 24,
    },
    center: {
      fill: '#a5a5a58c',
    },
  }
}

export const useMapThemeStore = create<MapThemeStore>(set => ({
  mapTheme: createMapThemeFromBase(),

  updateFromBaseTheme: () => {
    set({ mapTheme: createMapThemeFromBase() })
  },
}))

// Hooks für einfache Nutzung
export const useMapTheme = () => useMapThemeStore(state => state.mapTheme)
export const useUpdateMapTheme = () => useMapThemeStore(state => state.updateFromBaseTheme)

// Automatische Updates bei Theme-Änderungen
useThemeStore.subscribe(() => {
  useMapThemeStore.getState().updateFromBaseTheme()
})
