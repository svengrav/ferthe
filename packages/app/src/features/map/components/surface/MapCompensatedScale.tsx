import { createContext, useContext } from 'react'
import { SharedValue } from 'react-native-reanimated'

/**
 * Context for scale compensation in map gestures
 * Allows map elements to maintain constant visual size during zoom
 */
export const MapCompensatedScaleContext = createContext<SharedValue<number> | null>(null)

/**
 * Provider component for compensated scale context
 * Exported for use in MapCanvas and MapOverview
 */
export const MapCompensatedScaleProvider = MapCompensatedScaleContext.Provider

/**
 * Hook to access compensated scale for map elements
 * Works in both MapCanvas and MapOverview contexts
 */
export const useMapCompensatedScale = (): SharedValue<number> => {
  const context = useContext(MapCompensatedScaleContext)
  if (!context) {
    throw new Error('useMapCompensatedScale must be used within MapCompensatedScaleProvider')
  }
  return context
}
