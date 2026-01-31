import { DiscoverySpot } from '@shared/contracts'
import { GeoBoundary, GeoLocation, geoUtils } from '@shared/geo'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

export type MapLayer = 'CANVAS' | 'OVERVIEW'

// State type - the source of truth
export interface MapState {
  status: 'uninitialized' | 'loading' | 'ready' | 'error'
  activeLayer: MapLayer
  tappedSpot: DiscoverySpot | undefined
  container: {
    size: { width: number; height: number }
  }
  surface: {
    scale: { init: number; min: number; max: number }
    boundary: GeoBoundary
    image?: string
    layout: { left: number; top: number; width: number; height: number }
  }
  viewport: {
    size: { width: number; height: number }
    radius: number
    scale: { init: number; min: number; max: number }
    offset: { x: number; y: number }
    boundary: GeoBoundary
  }
  device: { heading: number; location: GeoLocation; direction: string }
  scanner: { radius: number }
  snap: { startPoint: GeoLocation; endPoint: GeoLocation; intensity: number }
}

export interface MapActions {
  setState: (state: Partial<MapState>) => void
  setStatus: (status: MapState['status']) => void
  setActiveLayer: (layer: MapLayer) => void
  setTappedSpot: (spot: DiscoverySpot | undefined) => void
  setContainer: (container: Partial<MapState['container']>) => void
  setSurface: (surface: Partial<MapState['surface']>) => void
  setViewport: (viewport: Partial<MapState['viewport']>) => void
  setDevice: (device: Partial<MapState['device']>) => void
  setScanner: (scanner: MapState['scanner']) => void
  setSnap: (snap: MapState['snap']) => void
}

const DEFAULT_BOUNDARY: GeoBoundary = { northEast: { lat: 0, lon: 0 }, southWest: { lat: 0, lon: 0 } }
const DEFAULT_LOCATION: GeoLocation = { lat: 0, lon: 0 }

export const useMapStore = create<MapState & MapActions>(set => ({
  status: 'uninitialized',
  activeLayer: 'CANVAS',
  tappedSpot: undefined,

  container: {
    size: { width: 1000, height: 1000 },
  },

  surface: {
    scale: { init: 1, min: 0.5, max: 2 },
    boundary: DEFAULT_BOUNDARY,
    image: undefined,
    layout: { left: 0, top: 0, width: 550, height: 550 },
  },

  viewport: {
    size: { width: 1000, height: 1000 },
    radius: 1000,
    scale: { init: 1, min: 0.5, max: 2 },
    offset: { x: 0, y: 0 },
    boundary: DEFAULT_BOUNDARY,
  },

  device: {
    heading: 0,
    location: DEFAULT_LOCATION,
    direction: 'N',
  },

  scanner: { radius: 1000 },

  snap: {
    startPoint: DEFAULT_LOCATION,
    endPoint: DEFAULT_LOCATION,
    intensity: 0,
  },

  // Actions
  setState: state => set(prev => ({ ...prev, ...state })),
  setStatus: status => set(state => (state.status !== status ? { status } : state)),
  setActiveLayer: activeLayer => set(state => (state.activeLayer !== activeLayer ? { activeLayer } : state)),
  setTappedSpot: tappedSpot => set({ tappedSpot }),
  setContainer: container => set(state => ({ container: { ...state.container, ...container } })),
  setSurface: surface => set(state => ({ surface: { ...state.surface, ...surface } })),
  setViewport: viewport => set(state => ({ viewport: { ...state.viewport, ...viewport } })),
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

// Viewport (visible area + gestures)
export const useMapViewport = () => useMapStore(useShallow(state => state.viewport))
export const useViewportDimensions = () => useMapStore(useShallow(state => state.viewport.size))
export const useViewportScale = () => useMapStore(state => state.viewport.scale.init)

// Device (location + heading)
export const useMapDevice = () => useMapStore(useShallow(state => state.device))
export const useMapCompass = () => useMapStore(useShallow(state => ({ heading: state.device.heading, direction: state.device.direction })))

// Scanner
export const useMapScanner = () => useMapStore(useShallow(state => state.scanner))

// Snap
export const useMapSnap = () => useMapStore(useShallow(state => state.snap))

// Interaction
export const useMapSpotTap = () => useMapStore(state => state.tappedSpot)

// =============================================================================
// Computed Hooks (derived values)
// =============================================================================

/** Compensated scale for UI elements - keeps markers visually stable during zoom */
export const useCompensatedScale = () => {
  const scale = useMapStore(state => state.viewport.scale.init)
  const baseCompensation = (1 / scale) * 2
  const dampening = 0.7
  const compensated = 1 + (baseCompensation - 1) * dampening
  return Math.max(0.6, Math.min(1.8, compensated))
}

/** Inverse of viewport scale for counter-scaling elements */
export const useViewportCompensationScale = () => {
  const scale = useMapStore(state => state.viewport.scale.init)
  return 1 / scale
}

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

/** Combined viewport values for gestures */
export const useViewportValues = () => useMapStore(useShallow(state => ({
  scale: state.viewport.scale.init,
  translationX: state.viewport.offset.x,
  translationY: state.viewport.offset.y,
})))

/** Viewport context for geo calculations */
export const useViewportContext = () => useMapStore(useShallow(state => ({
  deviceLocation: state.device.location,
  radiusMeters: state.viewport.radius,
  boundary: state.viewport.boundary,
})))

// =============================================================================
// Action Hooks
// =============================================================================

export const useSetActiveLayer = () => useMapStore(state => state.setActiveLayer)
export const useSetTappedSpot = () => useMapStore(state => state.setTappedSpot)

// =============================================================================
// Non-React Access (for application layer)
// =============================================================================

export const getMapState = () => useMapStore.getState()

export const getMapStoreActions = () => ({
  setState: useMapStore.getState().setState,
  setStatus: useMapStore.getState().setStatus,
  setActiveLayer: useMapStore.getState().setActiveLayer,
  setTappedSpot: useMapStore.getState().setTappedSpot,
  setContainer: useMapStore.getState().setContainer,
  setSurface: useMapStore.getState().setSurface,
  setViewport: useMapStore.getState().setViewport,
  setDevice: useMapStore.getState().setDevice,
  setScanner: useMapStore.getState().setScanner,
  setSnap: useMapStore.getState().setSnap,
})

export const getViewportActions = () => ({
  setStatus: useMapStore.getState().setStatus,
  setViewport: useMapStore.getState().setViewport,
  setDevice: useMapStore.getState().setDevice,
})

export const getViewportValues = () => {
  const state = useMapStore.getState()
  return {
    scale: state.viewport.scale.init,
    translationX: state.viewport.offset.x,
    translationY: state.viewport.offset.y,
  }
}

export const getViewportContext = () => {
  const state = useMapStore.getState()
  return {
    deviceLocation: state.device.location,
    radiusMeters: state.viewport.radius,
    boundary: state.viewport.boundary,
  }
}

// Derived action type from store
