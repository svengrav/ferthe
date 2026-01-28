import { createContext, useContext } from 'react'

interface MapSurfaceContextType {
  width: number
  height: number
}

const MapSurfaceContext = createContext<MapSurfaceContextType | null>(null)

export const MapSurfaceProvider = MapSurfaceContext.Provider

export const useMapSurfaceSize = () => {
  const context = useContext(MapSurfaceContext)
  if (!context) {
    throw new Error('useMapSurfaceSize must be used within MapSurfaceProvider')
  }
  return context
}
