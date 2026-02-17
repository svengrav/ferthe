import { GeoBoundary, GeoLocation, geoUtils } from '@shared/geo'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

import { getMapDefaults } from '../config/mapDefaults'

export type MapLayer = 'CANVAS' | 'OVERVIEW'

const defaults = getMapDefaults()

// State type - the source of truth
export interface MapState {
  status: 'uninitialized' | 'loading' | 'ready' | 'error'
  activeLayer: MapLayer
  container: {
    size: { width: number; height: number }
  }
  surface: {
    boundary: GeoBoundary
    image?: string
    layout: { left: number; top: number; width: number; height: number }
  }
  canvas: {
    size: { width: number; height: number }
    radius: number
    scale: { init: number; min: number; max: number }
    offset: { x: number; y: number }
    boundary: GeoBoundary
    image?: string
  }
  overview: {
    scale: { init: number; min: number; max: number }
    offset: { x: number; y: number }
    image?: string
  }
  device: { heading: number; location: GeoLocation; direction: string }
  scanner: { radius: number }
  snap: { startPoint: GeoLocation; endPoint: GeoLocation; intensity: number }
}

export interface MapActions {
  setState: (state: Partial<MapState>) => void
  setStatus: (status: MapState['status']) => void
  setActiveLayer: (layer: MapLayer) => void
  setContainer: (container: Partial<MapState['container']>) => void
  setSurface: (surface: Partial<MapState['surface']>) => void
  setCanvas: (canvas: Partial<MapState['canvas']>) => void
  setOverview: (overview: Partial<MapState['overview']>) => void
  setDevice: (device: Partial<MapState['device']>) => void
  setScanner: (scanner: MapState['scanner']) => void
  setSnap: (snap: MapState['snap']) => void
}

const DEFAULT_BOUNDARY: GeoBoundary = { northEast: { lat: 0, lon: 0 }, southWest: { lat: 0, lon: 0 } }
const DEFAULT_LOCATION: GeoLocation = { lat: 0, lon: 0 }

export const useMapStore = create<MapState & MapActions>(set => ({
  status: 'uninitialized',
  activeLayer: 'CANVAS',

  container: {
    size: { width: defaults.canvas.width, height: defaults.canvas.height },
  },

  surface: {
    boundary: DEFAULT_BOUNDARY,
    image: undefined,
    layout: { left: 0, top: 0, width: 550, height: 550 },
  },

  canvas: {
    size: { width: defaults.canvas.width, height: defaults.canvas.height },
    radius: defaults.canvas.radiusMeters,
    scale: { ...defaults.canvas.scale },  // Will be dynamically calculated on trail load
    offset: { x: 0, y: 0 },
    boundary: DEFAULT_BOUNDARY,
    image: undefined,
  },

  overview: {
    scale: { ...defaults.overview.scale },
    offset: { x: 0, y: 0 },
    image: undefined,
  },

  device: {
    heading: 0,
    location: DEFAULT_LOCATION,
    direction: 'N',
  },

  scanner: { radius: defaults.radius },

  snap: {
    startPoint: DEFAULT_LOCATION,
    endPoint: DEFAULT_LOCATION,
    intensity: 0,
  },

  // Actions
  setState: state => set(prev => ({ ...prev, ...state })),
  setStatus: status => set(state => (state.status !== status ? { status } : state)),
  setActiveLayer: activeLayer => set(state => (state.activeLayer !== activeLayer ? { activeLayer } : state)),
  setContainer: container => set(state => ({ container: { ...state.container, ...container } })),
  setSurface: surface => set(state => ({ surface: { ...state.surface, ...surface } })),
  setCanvas: canvas => set(state => ({ canvas: { ...state.canvas, ...canvas } })),
  setOverview: overview => set(state => ({ overview: { ...state.overview, ...overview } })),
  setDevice: device => set(state => ({ device: { ...state.device, ...device } })),
  setScanner: scanner => set({ scanner }),
  setSnap: snap => set({ snap }),
}))

// =============================================================================
// State Hooks (grouped by concept)
// =============================================================================

// Status
export const useMapStatus = () => useMapStore(state => state.status)
export const useMapLayer = () => useMapStore(state => state.activeLayer)

// Container (available UI space)
export const useMapContainerSize = () => useMapStore(useShallow(state => state.container.size))

// Surface (map image area)
export const useMapSurface = () => useMapStore(useShallow(state => state.surface))
export const useMapSurfaceBoundary = () => useMapStore(useShallow(state => state.surface.boundary))
export const useMapSurfaceLayout = () => useMapStore(useShallow(state => state.surface.layout))

// Canvas (device-centered canvas mode)
export const useMapCanvas = () => useMapStore(useShallow(state => state.canvas))
export const useMapCanvasDimensions = () => useMapStore(useShallow(state => state.canvas.size))
export const useMapCanvasScale = () => useMapStore(state => state.canvas.scale.init)

// Overview (full trail overview mode)
export const useMapOverview = () => useMapStore(useShallow(state => state.overview))

// Device (location + heading)
export const useMapDevice = () => useMapStore(useShallow(state => state.device))
export const useMapCompass = () => useMapStore(useShallow(state => ({ heading: state.device.heading, direction: state.device.direction })))

// Scanner
export const useMapScanner = () => useMapStore(useShallow(state => state.scanner))

// Snap
export const useMapSnap = () => useMapStore(useShallow(state => state.snap))

// =============================================================================
// Computed Hooks (derived values)
// =============================================================================

/** Device boundary status - calculated from device location and surface boundary */
export const useDeviceBoundaryStatus = () => {
  const deviceLocation = useMapStore(state => state.device.location)
  const boundary = useMapStore(useShallow(state => state.surface.boundary))

  if (!deviceLocation || (deviceLocation.lat === 0 && deviceLocation.lon === 0)) {
    return { isOutsideBoundary: false, distanceFromBoundary: 0 }
  }

  const isInside = geoUtils.isCoordinateInBounds(deviceLocation, boundary)
  if (isInside) {
    return { isOutsideBoundary: false, distanceFromBoundary: 0 }
  }

  const { distance, closestPoint } = geoUtils.calculateDistanceToBoundary(deviceLocation, boundary)
  return { isOutsideBoundary: true, distanceFromBoundary: distance, closestBoundaryPoint: closestPoint }
}

/** Combined canvas values for gestures */
export const useMapCanvasValues = () => useMapStore(useShallow(state => ({
  scale: state.canvas.scale.init,
  translationX: state.canvas.offset.x,
  translationY: state.canvas.offset.y,
})))

/** Canvas context for geo calculations */
export const useMapCanvasContext = () => useMapStore(useShallow(state => ({
  deviceLocation: state.device.location,
  radiusMeters: state.canvas.radius,
  boundary: state.canvas.boundary,
})))

// =============================================================================
// Action Hooks
// =============================================================================

export const useSetActiveLayer = () => useMapStore(state => state.setActiveLayer)

// =============================================================================
// Non-React Access (for application layer)
// =============================================================================

export const getMapState = () => useMapStore.getState()

export const getMapStoreActions = () => ({
  setState: useMapStore.getState().setState,
  setStatus: useMapStore.getState().setStatus,
  setActiveLayer: useMapStore.getState().setActiveLayer,
  setContainer: useMapStore.getState().setContainer,
  setSurface: useMapStore.getState().setSurface,
  setCanvas: useMapStore.getState().setCanvas,
  setOverview: useMapStore.getState().setOverview,
  setDevice: useMapStore.getState().setDevice,
  setScanner: useMapStore.getState().setScanner,
  setSnap: useMapStore.getState().setSnap,
})

export const getMapCanvasActions = () => ({
  setStatus: useMapStore.getState().setStatus,
  setCanvas: useMapStore.getState().setCanvas,
  setDevice: useMapStore.getState().setDevice,
})

export const getMapCanvasValues = () => {
  const state = useMapStore.getState()
  return {
    scale: state.canvas.scale.init,
    translationX: state.canvas.offset.x,
    translationY: state.canvas.offset.y,
  }
}

export const getMapCanvasContext = () => {
  const state = useMapStore.getState()
  return {
    deviceLocation: state.device.location,
    radiusMeters: state.canvas.radius,
    boundary: state.canvas.boundary,
  }
}

// Derived action type from store
