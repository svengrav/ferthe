import { createContext, useContext } from 'react'
import { SharedValue } from 'react-native-reanimated'

/**
 * Context for scale compensation in map gestures
 * Allows map elements to maintain constant visual size during zoom
 */
export const MapCompensatedScaleContext = createContext<SharedValue<number> | null>(null)
export const MapCompensatedScaleProvider = MapCompensatedScaleContext.Provider

export const useMapCompensatedScale = (): SharedValue<number> => {
  const context = useContext(MapCompensatedScaleContext)
  if (!context) throw new Error('useMapCompensatedScale must be used within MapCompensatedScaleProvider')
  return context
}

/**
 * Context for raw viewport scale (used e.g. for noise overlay opacity)
 */
export const MapScaleContext = createContext<SharedValue<number> | null>(null)
export const MapScaleProvider = MapScaleContext.Provider

export const useMapScale = (): SharedValue<number> | null => useContext(MapScaleContext)
