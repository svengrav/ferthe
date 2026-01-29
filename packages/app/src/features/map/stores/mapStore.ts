import { Clue, DiscoverySpot } from '@shared/contracts'
import { GeoBoundary, GeoLocation } from '@shared/geo'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

// Utility function for efficient deep comparison
const deepEqual = <T>(objA: T, objB: T): boolean => {
  if (objA === objB) return true
  if (objA == null || objB == null) return false
  if (typeof objA !== 'object' || typeof objB !== 'object') return false

  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) return false

  return keysA.every(key => deepEqual((objA as any)[key], (objB as any)[key]))
}

export type MapLayer = 'CANVAS' | 'OVERVIEW'

export interface MapState {
  status: 'uninitialized' | 'loading' | 'ready' | 'error'

  activeLayer: MapLayer,

  tappedSpot: DiscoverySpot | undefined
  // Volatile UI State - changes frequently

  surface: {
    size: { width: number; height: number } // Default map size
    scale: {
      init: number
      min: number
      max: number
    }
    boundary: GeoBoundary // Boundary of the map
    image?: string | undefined
    layout: { left: number; top: number; width: number; height: number } // Position within viewport
  }

  viewport: {
    size: { width: number; height: number }
    radius: number
    scale: {
      init: number
      min: number
      max: number
    }
    offset: { x: number; y: number }
    boundary: GeoBoundary
  }

  device: {
    heading: number
    location: GeoLocation
    direction: string
  }

  deviceStatus: {
    isOutsideBoundary: boolean
    distanceFromBoundary: number // Distance in meters, 0 if inside, positive if outside
  }

  scanner: {
    radius: number
  }

  snap: {
    startPoint: GeoLocation
    endPoint: GeoLocation
    intensity: number
  }



  // viewportTransform: {
  //   scale: SharedValue<number> | null
  //   translationX: SharedValue<number> | null
  //   translationY: SharedValue<number> | null
  // }

  // // Viewport context (geo-specific data for viewport)
  // viewportDeviceLocation: GeoLocation
  // viewportRadiusMeters: number
  // viewportBoundary: GeoBoundary

  // region: {
  //   center: { lat: number; lon: number } // Center of the region
  //   radius: number
  //   innerRadius: number // Inner radius for the scanner
  // }

  // discovery data
  trailId: string // Optional trail ID for discovery context
  previewClues: Clue[]
  scannedClues: Clue[]
  spots: DiscoverySpot[]
}

export interface MapStateActions {
  // Generic state setter
  setState: (state: Partial<MapState>) => void

  // Top-level properties
  setStatus: (status: 'uninitialized' | 'loading' | 'ready' | 'error') => void
  setActiveLayer: (layer: MapLayer) => void
  setTappedSpot: (spot: DiscoverySpot | undefined) => void
  setTrailId: (trailId: string) => void
  setPreviewClues: (clues: Clue[]) => void
  setScannedClues: (clues: Clue[]) => void
  setSpots: (spots: DiscoverySpot[]) => void

  // Surface setters
  setSurface: (surface: Partial<MapState['surface']>) => void
  setSurfaceSize: (size: { width: number; height: number }) => void
  setSurfaceScale: (scale: { init: number; min: number; max: number }) => void
  setSurfaceBoundary: (boundary: GeoBoundary) => void
  setSurfaceLayout: (layout: { left: number; top: number; width: number; height: number }) => void
  setSurfaceImage: (image: string | undefined) => void

  // Viewport setters
  setViewport: (viewport: Partial<MapState['viewport']>) => void
  setViewportSize: (size: { width: number; height: number }) => void
  setViewportRadius: (radius: number) => void
  setViewportScale: (scale: { init: number; min: number; max: number }) => void
  setViewportOffset: (offset: { x: number; y: number }) => void
  setViewportBoundary: (boundary: GeoBoundary) => void
  setViewportTransform: (scale: number, offset: { x: number; y: number }) => void

  // Device setters
  setDevice: (device: Partial<MapState['device']>) => void
  setDeviceLocation: (location: GeoLocation) => void
  setDeviceHeading: (heading: number) => void
  setDeviceDirection: (direction: string) => void

  // Other nested properties
  setDeviceStatus: (status: { isOutsideBoundary: boolean; distanceFromBoundary: number }) => void
  setScanner: (scanner: { radius: number }) => void
  setSnap: (snap: { startPoint: GeoLocation; endPoint: GeoLocation; intensity: number }) => void
}

export const useMapStore = create<MapState & MapStateActions>(set => ({
  status: 'uninitialized',
  activeLayer: 'CANVAS',
  tappedSpot: undefined,

  surface: {
    size: { width: 550, height: 550 },
    scale: {
      init: 1,
      min: 0.5,
      max: 2,
    },
    boundary: { northEast: { lat: 0, lon: 0 }, southWest: { lat: 0, lon: 0 } },
    image: undefined,
    layout: { left: 0, top: 0, width: 550, height: 550 },
  },

  viewport: {
    size: { width: 1000, height: 1000 },
    radius: 1000,
    scale: {
      init: 1,
      min: 0.5,
      max: 2,
    },
    offset: { x: 0, y: 0 },
    boundary: { northEast: { lat: 0, lon: 0 }, southWest: { lat: 0, lon: 0 } },
  },

  device: {
    heading: 0,
    location: { lat: 0, lon: 0 },
    direction: 'N',
  },

  deviceStatus: {
    isOutsideBoundary: false,
    distanceFromBoundary: 0,
  },

  scanner: {
    radius: 1000,
  },

  snap: {
    startPoint: { lat: 0, lon: 0 },
    endPoint: { lat: 0, lon: 0 },
    intensity: 0,
  },

  trailId: '',
  previewClues: [],
  scannedClues: [],
  spots: [],

  // Generic state setter
  setState: (state: Partial<MapState>) => set(prev => ({ ...prev, ...state })),

  // Top-level properties
  setStatus: (status: 'uninitialized' | 'loading' | 'ready' | 'error') =>
    set(state => (state.status !== status ? { status } : state)),

  setActiveLayer: (layer: MapLayer) =>
    set(state => (state.activeLayer !== layer ? { activeLayer: layer } : state)),

  setTappedSpot: tappedSpot => set({ tappedSpot }),
  setTrailId: (trailId: string) =>
    set(state => (state.trailId !== trailId ? { trailId } : state)),

  setPreviewClues: previewClues => set({ previewClues }),
  setScannedClues: scannedClues => set({ scannedClues }),
  setSpots: spots => set({ spots }),

  // Surface setters
  setSurface: (surface: Partial<MapState['surface']>) =>
    set(state => {
      const newSurface = { ...state.surface, ...surface }
      return deepEqual(state.surface, newSurface) ? state : { surface: newSurface }
    }),

  setSurfaceSize: (size: { width: number; height: number }) =>
    set(state => {
      if (state.surface.size.width !== size.width || state.surface.size.height !== size.height) {
        return { surface: { ...state.surface, size } }
      }
      return state
    }),

  setSurfaceScale: (scale: { init: number; min: number; max: number }) =>
    set(state => {
      if (!deepEqual(state.surface.scale, scale)) {
        return { surface: { ...state.surface, scale } }
      }
      return state
    }),

  setSurfaceBoundary: (boundary: GeoBoundary) =>
    set(state => {
      if (!deepEqual(state.surface.boundary, boundary)) {
        return { surface: { ...state.surface, boundary } }
      }
      return state
    }),

  setSurfaceLayout: (layout: { left: number; top: number; width: number; height: number }) =>
    set(state => {
      if (!deepEqual(state.surface.layout, layout)) {
        return { surface: { ...state.surface, layout } }
      }
      return state
    }),

  setSurfaceImage: (image: string | undefined) =>
    set(state => (state.surface.image !== image ? { surface: { ...state.surface, image } } : state)),

  // Viewport setters
  setViewport: (viewport: Partial<MapState['viewport']>) =>
    set(state => {
      const newViewport = { ...state.viewport, ...viewport }
      return deepEqual(state.viewport, newViewport) ? state : { viewport: newViewport }
    }),

  setViewportSize: (size: { width: number; height: number }) =>
    set(state => {
      if (state.viewport.size.width !== size.width || state.viewport.size.height !== size.height) {
        return { viewport: { ...state.viewport, size } }
      }
      return state
    }),

  setViewportRadius: (radius: number) =>
    set(state => (state.viewport.radius !== radius ? { viewport: { ...state.viewport, radius } } : state)),

  setViewportScale: (scale: { init: number; min: number; max: number }) =>
    set(state => {
      if (!deepEqual(state.viewport.scale, scale)) {
        return { viewport: { ...state.viewport, scale } }
      }
      return state
    }),

  setViewportOffset: (offset: { x: number; y: number }) =>
    set(state => {
      if (state.viewport.offset.x !== offset.x || state.viewport.offset.y !== offset.y) {
        return { viewport: { ...state.viewport, offset } }
      }
      return state
    }),

  setViewportBoundary: (boundary: GeoBoundary) =>
    set(state => {
      if (!deepEqual(state.viewport.boundary, boundary)) {
        return { viewport: { ...state.viewport, boundary } }
      }
      return state
    }),

  setViewportTransform: (scale: number, offset: { x: number; y: number }) =>
    set(state => {
      const scaleChanged = state.viewport.scale.init !== scale
      const offsetChanged = state.viewport.offset.x !== offset.x || state.viewport.offset.y !== offset.y
      if (scaleChanged || offsetChanged) {
        return {
          viewport: {
            ...state.viewport,
            scale: { ...state.viewport.scale, init: scale },
            offset
          }
        }
      }
      return state
    }),

  // Device setters
  setDevice: (device: Partial<MapState['device']>) =>
    set(state => {
      const newDevice = { ...state.device, ...device }
      return deepEqual(state.device, newDevice) ? state : { device: newDevice }
    }),

  setDeviceLocation: (location: GeoLocation) =>
    set(state => {
      if (state.device.location.lat !== location.lat || state.device.location.lon !== location.lon) {
        return { device: { ...state.device, location } }
      }
      return state
    }),

  setDeviceHeading: (heading: number) =>
    set(state => (state.device.heading !== heading ? { device: { ...state.device, heading } } : state)),

  setDeviceDirection: (direction: string) =>
    set(state => (state.device.direction !== direction ? { device: { ...state.device, direction } } : state)),

  // Other nested properties
  setDeviceStatus: deviceStatus => set({ deviceStatus }),
  setScanner: scanner => set({ scanner }),
  setSnap: snap => set({ snap }),
}))

export const getMapStoreActions = () => ({
  setState: useMapStore.getState().setState,
  setStatus: useMapStore.getState().setStatus,
  setActiveLayer: useMapStore.getState().setActiveLayer,
  setTappedSpot: useMapStore.getState().setTappedSpot,
  setTrailId: useMapStore.getState().setTrailId,
  setPreviewClues: useMapStore.getState().setPreviewClues,
  setScannedClues: useMapStore.getState().setScannedClues,
  setSpots: useMapStore.getState().setSpots,
  setSurface: useMapStore.getState().setSurface,
  setSurfaceSize: useMapStore.getState().setSurfaceSize,
  setSurfaceScale: useMapStore.getState().setSurfaceScale,
  setSurfaceBoundary: useMapStore.getState().setSurfaceBoundary,
  setSurfaceLayout: useMapStore.getState().setSurfaceLayout,
  setSurfaceImage: useMapStore.getState().setSurfaceImage,
  setViewport: useMapStore.getState().setViewport,
  setViewportSize: useMapStore.getState().setViewportSize,
  setViewportRadius: useMapStore.getState().setViewportRadius,
  setViewportScale: useMapStore.getState().setViewportScale,
  setViewportOffset: useMapStore.getState().setViewportOffset,
  setViewportBoundary: useMapStore.getState().setViewportBoundary,
  setViewportTransform: useMapStore.getState().setViewportTransform,
  setDevice: useMapStore.getState().setDevice,
  setDeviceLocation: useMapStore.getState().setDeviceLocation,
  setDeviceHeading: useMapStore.getState().setDeviceHeading,
  setDeviceDirection: useMapStore.getState().setDeviceDirection,
  setDeviceStatus: useMapStore.getState().setDeviceStatus,
  setScanner: useMapStore.getState().setScanner,
  setSnap: useMapStore.getState().setSnap,
})

// Granular hooks for volatile data
export const useMapScale = () => useMapStore(state => state.viewport.scale.init)
export const useMapDevice = () => useMapStore(state => state.device)
export const useMapViewport = () => useMapStore(state => state.viewport)
export const useMapRadius = () => useMapStore(state => state.viewport.radius)
export const useMapTrailId = () => useMapStore(state => state.trailId)
export const useMapLayer = () => useMapStore(state => state.activeLayer)

// Additional state hooks
export const useMapDeviceStatus = () => useMapStore(state => state.deviceStatus)
export const useMapScanner = () => useMapStore(state => state.scanner)
export const useMapSurface = () => useMapStore(state => state.surface)
export const useMapSurfaceBoundary = () => useMapStore(state => state.surface.boundary)
export const useMapSurfaceSize = () => useMapStore(state => state.surface.size)
export const useMapSurfaceLayout = () => useMapStore(state => state.surface.layout)
export const useMapPreviewClues = () => useMapStore(state => state.previewClues)
export const useMapScannedClues = () => useMapStore(state => state.scannedClues)
export const useMapSpots = () => useMapStore(state => state.spots)
export const useMapSpotTap = () => useMapStore(state => state.tappedSpot)
export const useMapSnap = () => useMapStore(state => state.snap)
export const useMapStatus = () => useMapStore(state => state.status)
export const useMapCompass = () => useMapStore(useShallow(state => ({ heading: state.device.heading, direction: state.device.direction })))

// Compensated scale for UI elements - keeps objects visually stable
export const useCompensatedScale = () => {
  const scale = useMapScale()
  const baseCompensation = (1 / scale) * 2
  const dampening = 0.7
  const compensated = 1 + (baseCompensation - 1) * dampening
  return Math.max(0.6, Math.min(1.8, compensated))
}

// Individual action hooks - stable references
export const useSetActiveLayer = () => useMapStore(state => state.setActiveLayer)
export const useSetDevice = () => useMapStore(state => state.setDevice)
export const useSetDeviceLocation = () => useMapStore(state => state.setDeviceLocation)
export const useSetDeviceHeading = () => useMapStore(state => state.setDeviceHeading)
export const useSetDeviceDirection = () => useMapStore(state => state.setDeviceDirection)
export const useSetDeviceStatus = () => useMapStore(state => state.setDeviceStatus)
export const useSetViewport = () => useMapStore(state => state.setViewport)
export const useSetViewportSize = () => useMapStore(state => state.setViewportSize)
export const useSetViewportRadius = () => useMapStore(state => state.setViewportRadius)
export const useSetViewportScale = () => useMapStore(state => state.setViewportScale)
export const useSetViewportOffset = () => useMapStore(state => state.setViewportOffset)
export const useSetViewportBoundary = () => useMapStore(state => state.setViewportBoundary)
export const useSetViewportTransform = () => useMapStore(state => state.setViewportTransform)
export const useSetSurface = () => useMapStore(state => state.setSurface)
export const useSetSurfaceSize = () => useMapStore(state => state.setSurfaceSize)
export const useSetSurfaceScale = () => useMapStore(state => state.setSurfaceScale)
export const useSetSurfaceBoundary = () => useMapStore(state => state.setSurfaceBoundary)
export const useSetSurfaceImage = () => useMapStore(state => state.setSurfaceImage)
export const useSetScanner = () => useMapStore(state => state.setScanner)
export const useSetPreviewClues = () => useMapStore(state => state.setPreviewClues)
export const useSetScannedClues = () => useMapStore(state => state.setScannedClues)
export const useSetSpots = () => useMapStore(state => state.setSpots)
export const useSetTappedSpot = () => useMapStore(state => state.setTappedSpot)
export const useSetSnap = () => useMapStore(state => state.setSnap)

export const getMapState = () => useMapStore.getState()

// Viewport hooks (compatibility with old viewportStore)
export const useViewportStatus = () => useMapStore(state => state.status)
export const useViewportScale = () => useMapStore(state => state.viewport.scale.init)
export const useViewportCompensationScale = () => {
  const scale = useMapStore(state => state.viewport.scale.init)
  return 1 / scale
}
export const useViewportTranslation = () => useMapStore(useShallow(state => ({ x: state.viewport.offset.x, y: state.viewport.offset.y })))
export const useViewportValues = () => useMapStore(useShallow(state => ({ scale: state.viewport.scale.init, translationX: state.viewport.offset.x, translationY: state.viewport.offset.y })))
export const useViewportDimensions = () => useMapStore(useShallow(state => ({ width: state.viewport.size.width, height: state.viewport.size.height })))
export const useViewportSharedValues = () => null
export const useViewportContext = () => useMapStore(useShallow(state => ({ deviceLocation: state.device.location, radiusMeters: state.viewport.radius, boundary: state.viewport.boundary })))
export const useViewportBoundary = () => useMapStore(state => state.viewport.boundary)
export const useViewportDeviceLocation = () => useMapStore(state => state.device.location)

// Direct state access (outside React)
export const getViewportValues = () => {
  const state = useMapStore.getState()
  return { scale: state.viewport.scale.init, translationX: state.viewport.offset.x, translationY: state.viewport.offset.y }
}

export const getViewportSharedValues = () => null

export const getViewportContext = () => {
  const state = useMapStore.getState()
  return { deviceLocation: state.device.location, radiusMeters: state.viewport.radius, boundary: state.viewport.boundary }
}

export const getViewportActions = () => ({
  setStatus: useMapStore.getState().setStatus,
  setViewportDimensions: useMapStore.getState().setViewportSize,
  setViewportScale: useMapStore.getState().setViewportScale,
  setViewportOffset: useMapStore.getState().setViewportOffset,
  setViewportBoundary: useMapStore.getState().setViewportBoundary,
  setViewportTransform: useMapStore.getState().setViewportTransform,
  setDeviceLocation: useMapStore.getState().setDeviceLocation,
})

// Legacy export for compatibility
export const viewportStore = useMapStore
