import { createContext, useContext } from 'react'
import { SharedValue } from 'react-native-reanimated'

/**
 * Context for scale values in map gestures
 * - scale: Raw zoom scale (1 = no zoom, 2 = 2x zoom, etc.)
 * - compensatedScale: Dampened inverse scale for keeping UI elements stable
 */
interface MapScaleContext {
  scale: SharedValue<number>
  compensatedScale: SharedValue<number>
}

export const MapScaleContext = createContext<MapScaleContext | null>(null)

/**
 * Provider component for scale context
 * Exported for use in MapCanvas and MapOverview
 */
export const MapScaleProvider = MapScaleContext.Provider

/**
 * Hook to access compensated scale for map elements (markers, labels)
 * Works in both MapCanvas and MapOverview contexts
 */
export const useMapCompensatedScale = (): SharedValue<number> => {
  const context = useContext(MapScaleContext)
  if (!context) {
    throw new Error('useMapCompensatedScale must be used within MapScaleProvider')
  }
  return context.compensatedScale
}

/**
 * Hook to access raw scale value for inverse transformations
 * Works in both MapCanvas and MapOverview contexts
 */
export const useMapRawScale = (): SharedValue<number> => {
  const context = useContext(MapScaleContext)
  if (!context) {
    throw new Error('useMapRawScale must be used within MapScaleProvider')
  }
  return context.scale
}
