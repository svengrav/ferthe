import { Clue, DiscoverySpot } from '@shared/contracts'
import { GeoBoundary, GeoLocation } from '@shared/geo'
import { create } from 'zustand'
import { MapLayer, ZoomMode } from '../types/map'

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

export interface MapState {
  status: 'uninitialized' | 'loading' | 'ready' | 'error'
  zoomMode: ZoomMode
  mapLayer: MapLayer // Current map layer mode (CANVAS or OVERVIEW)
  // Volatile UI State - changes frequently

  compass: {
    heading: number
    direction: string
  }

  device: {
    heading: number
    location: GeoLocation
  }

  deviceStatus: {
    isOutsideBoundary: boolean
    distanceFromBoundary: number // Distance in meters, 0 if inside, positive if outside
  }

  snap: {
    startPoint: GeoLocation
    endPoint: GeoLocation
    intensity: number
  }

  scanner: {
    radius: number
  }

  boundary: GeoBoundary // Boundary of the map (may be clamped in CANVAS mode)
  trailBoundary: GeoBoundary // Full trail boundary (used in OVERVIEW mode)

  tappedSpot: DiscoverySpot | undefined

  canvas: {
    size: { width: number; height: number } // Default map size
    scale: {
      init: number
      min: number
      max: number
    }
    image?: string | undefined
  }

  viewport: {
    width: number
    height: number
  }
  scale: number // Current scale factor for the map, used for zooming

  // Navigation Canvas state
  followMode: boolean // Auto-center on device position
  panOffset: { x: number; y: number } // Temporary offset from user pan gesture

  // discovery data
  trailId: string // Optional trail ID for discovery context
  previewClues: Clue[]
  scannedClues: Clue[]
  spots: DiscoverySpot[]
}

export interface MapStateActions {
  // Actions
  setState: (state: Partial<MapState>) => void
  setScale: (scale: number) => void
  setZoomMode: (mode: ZoomMode) => void
  setCompass: (compass: { heading: number; direction: string }) => void
  setDevice: (device: { location: GeoLocation; heading: number }) => void
  setViewport: (viewport: { width: number; height: number }) => void
  setDeviceStatus: (status: { isOutsideBoundary: boolean; distanceFromBoundary: number; closestBoundaryPoint?: GeoLocation }) => void
  setScanner: (scanner: { radius: number }) => void
  setCanvas: (canvas: { size: { width: number; height: number }; boundary: GeoBoundary; image?: string | undefined }) => void
  setPreviewClues: (clues: Clue[]) => void
  setScannedClues: (clues: Clue[]) => void
  setSpots: (spots: DiscoverySpot[]) => void
  setTappedSpot: (spot: DiscoverySpot | undefined) => void
  setSnap: (snap: { startPoint: GeoLocation; endPoint: GeoLocation; intensity: number }) => void
  setStatus: (status: 'uninitialized' | 'loading' | 'ready' | 'error') => void
  setTrailId: (trailId: string) => void
  setBoundary: (boundary: GeoBoundary) => void
  setFollowMode: (followMode: boolean) => void
  setPanOffset: (panOffset: { x: number; y: number }) => void
  setMapLayer: (layer: MapLayer) => void
  setTrailBoundary: (boundary: GeoBoundary) => void
}

export const useMapStore = create<MapState & MapStateActions>(set => ({
  status: 'uninitialized', // Initial status
  zoomMode: 'NAV',
  mapLayer: 'CANVAS', // Default to Canvas mode

  // Dynamics in UI State - changes frequently
  compass: { heading: 0, direction: 'N' },
  device: {
    location: { lat: 0, lon: 0 },
    heading: 0,
  },
  deviceStatus: {
    isOutsideBoundary: false,
    distanceFromBoundary: 0,
  },
  snap: {
    startPoint: { lat: 0, lon: 0 },
    endPoint: { lat: 0, lon: 0 },
    intensity: 0,
  },
  boundary: { northEast: { lat: 0, lon: 0 }, southWest: { lat: 0, lon: 0 } },
  trailBoundary: { northEast: { lat: 0, lon: 0 }, southWest: { lat: 0, lon: 0 } },
  scale: 1,

  // Navigation Canvas state
  followMode: true,
  panOffset: { x: 0, y: 0 },

  // Fixed ui state - rarely changes
  scanner: {
    radius: 1000,
  },

  canvas: {
    size: { width: 550, height: 550 }, // Default container size
    scale: {
      init: 1,
      min: 0.5,
      max: 2,
    },
    image: undefined,
  },
  viewport: { width: 0, height: 0 },

  // Discovery data
  trailId: '',
  previewClues: [],
  scannedClues: [],
  spots: [],
  tappedSpot: undefined,

  // Actions - only update if values actually changed
  setState: (state: Partial<MapState>) => set(prev => ({ ...prev, ...state })),
  setScale: (scale: number) => set(state => (state.scale !== scale ? { scale } : state)),
  setZoomMode: (zoomMode: ZoomMode) => set(state => (state.zoomMode !== zoomMode ? { zoomMode } : state)),
  setCompass: (compass: { heading: number; direction: string }) =>
    set(state => (state.compass.heading !== compass.heading || state.compass.direction !== compass.direction ? { compass } : state)),
  setDevice: (device: { location: GeoLocation; heading: number }) =>
    set(state =>
      state.device.location.lat !== device.location.lat || state.device.location.lon !== device.location.lon || state.device.heading !== device.heading ? { device } : state
    ),
  setCanvas: (canvas: { size: { width: number; height: number }; image?: string | undefined }) =>
    set(state => (deepEqual(state.canvas, { ...state.canvas, ...canvas }) ? state : { canvas: { ...state.canvas, ...canvas } })),
  setViewport: (viewport: { width: number; height: number }) =>
    set(state => (state.viewport.width !== viewport.width || state.viewport.height !== viewport.height ? { viewport } : state)),
  setDeviceStatus: deviceStatus => set({ deviceStatus }),
  setScanner: scanner => set({ scanner }),
  setPreviewClues: previewClues => set({ previewClues }),
  setScannedClues: scannedClues => set({ scannedClues }),
  setSpots: spots => set({ spots }),
  setTappedSpot: tappedSpot => set({ tappedSpot }),
  setSnap: snap => set({ snap }),
  setStatus: (status: 'uninitialized' | 'loading' | 'ready' | 'error') => set(state => (state.status !== status ? { status } : state)),
  setTrailId: (trailId: string) => set(state => (state.trailId !== trailId ? { trailId } : state)),
  setBoundary: (boundary: GeoBoundary) => set(state => (deepEqual(state.boundary, boundary) ? state : { boundary })),
  setFollowMode: (followMode: boolean) => set(state => (state.followMode !== followMode ? { followMode } : state)),
  setPanOffset: (panOffset: { x: number; y: number }) =>
    set(state => (state.panOffset.x !== panOffset.x || state.panOffset.y !== panOffset.y ? { panOffset } : state)),
  setMapLayer: (mapLayer: MapLayer) => set(state => (state.mapLayer !== mapLayer ? { mapLayer } : state)),
  setTrailBoundary: (trailBoundary: GeoBoundary) => set(state => (deepEqual(state.trailBoundary, trailBoundary) ? state : { trailBoundary })),
}))

export const getMapStoreActions = () => ({
  setState: useMapStore.getState().setState,
  setScale: useMapStore.getState().setScale,
  setZoomMode: useMapStore.getState().setZoomMode,
  setCompass: useMapStore.getState().setCompass,
  setDevice: useMapStore.getState().setDevice,
  setViewport: useMapStore.getState().setViewport,
  setDeviceStatus: useMapStore.getState().setDeviceStatus,
  setScanner: useMapStore.getState().setScanner,
  setCanvas: useMapStore.getState().setCanvas,
  setBoundary: useMapStore.getState().setBoundary,
  setPreviewClues: useMapStore.getState().setPreviewClues,
  setScannedClues: useMapStore.getState().setScannedClues,
  setSpots: useMapStore.getState().setSpots,
  setTappedSpot: useMapStore.getState().setTappedSpot,
  setSnap: useMapStore.getState().setSnap,
  setTrailId: useMapStore.getState().setTrailId,
  setStatus: useMapStore.getState().setStatus,
  setFollowMode: useMapStore.getState().setFollowMode,
  setPanOffset: useMapStore.getState().setPanOffset,
  setMapLayer: useMapStore.getState().setMapLayer,
  setTrailBoundary: useMapStore.getState().setTrailBoundary,
})

// Granular hooks for volatile data
export const useMapScale = () => useMapStore(state => state.scale)
export const useZoomMode = () => useMapStore(state => state.zoomMode)
export const useMapCompass = () => useMapStore(state => state.compass)
export const useMapDevice = () => useMapStore(state => state.device)
export const useMapViewport = () => useMapStore(state => state.viewport)
export const useMapTrailId = () => useMapStore(state => state.trailId)

// Additional state hooks
export const useMapDeviceStatus = () => useMapStore(state => state.deviceStatus)
export const useMapScanner = () => useMapStore(state => state.scanner)
export const useMapCanvas = () => useMapStore(state => state.canvas)
export const useMapBoundary = () => useMapStore(state => state.boundary)
export const useMapSize = () => useMapStore(state => state.canvas.size)
export const useMapPreviewClues = () => useMapStore(state => state.previewClues)
export const useMapScannedClues = () => useMapStore(state => state.scannedClues)
export const useMapSpots = () => useMapStore(state => state.spots)
export const useMapSpotTap = () => useMapStore(state => state.tappedSpot)
export const useMapSnap = () => useMapStore(state => state.snap)
export const useMapStatus = () => useMapStore(state => state.status)
export const useMapFollowMode = () => useMapStore(state => state.followMode)
export const useMapPanOffset = () => useMapStore(state => state.panOffset)
export const useMapLayer = () => useMapStore(state => state.mapLayer)
export const useMapTrailBoundary = () => useMapStore(state => state.trailBoundary)

// Compensated scale for UI elements - keeps objects visually stable
export const useCompensatedScale = () => {
  const scaleConfig = useMapScale()
  // When map scale is small (zoomed out), make objects larger to keep them visible
  // When map scale is large (zoomed in), make objects smaller to not overwhelm
  // Use a more subtle compensation to avoid extreme size changes
  const baseCompensation = (1 / scaleConfig) * 2
  const dampening = 0.7 // Reduce the effect by 30%
  const compensated = 1 + (baseCompensation - 1) * dampening
  return Math.max(0.6, Math.min(1.8, compensated))
}

// Individual action hooks - stable references
export const useSetScale = () => useMapStore(state => state.setScale)
export const useSetZoomMode = () => useMapStore(state => state.setZoomMode)
export const useSetCompass = () => useMapStore(state => state.setCompass)
export const useSetDevice = () => useMapStore(state => state.setDevice)
export const useSetViewport = () => useMapStore(state => state.setViewport)
export const useSetDeviceStatus = () => useMapStore(state => state.setDeviceStatus)
export const useSetScanner = () => useMapStore(state => state.setScanner)
export const useSetCanvas = () => useMapStore(state => state.setCanvas)
export const useSetPreviewClues = () => useMapStore(state => state.setPreviewClues)
export const useSetScannedClues = () => useMapStore(state => state.setScannedClues)
export const useSetSpots = () => useMapStore(state => state.setSpots)
export const useSetTappedSpot = () => useMapStore(state => state.setTappedSpot)
export const useSetSnap = () => useMapStore(state => state.setSnap)
export const useSetFollowMode = () => useMapStore(state => state.setFollowMode)
export const useSetPanOffset = () => useMapStore(state => state.setPanOffset)
export const useSetMapLayer = () => useMapStore(state => state.setMapLayer)
export const useSetTrailBoundary = () => useMapStore(state => state.setTrailBoundary)

export const getMapState = () => useMapStore.getState()
