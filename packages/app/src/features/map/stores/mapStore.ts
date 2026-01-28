import { Clue, DiscoverySpot } from '@shared/contracts'
import { GeoBoundary, GeoLocation } from '@shared/geo'
import { SharedValue } from 'react-native-reanimated'
import { create } from 'zustand'

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

  mapLayer: MapLayer,

  boundary: GeoBoundary // Boundary of the map

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

  viewportTransform: {
    scale: SharedValue<number> | null
    translationX: SharedValue<number> | null
    translationY: SharedValue<number> | null
  }

  region: {
    center: { lat: number; lon: number } // Center of the region
    radius: number
    innerRadius: number // Inner radius for the scanner
  }

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
  setCompass: (compass: { heading: number; direction: string }) => void
  setDevice: (device: { location: GeoLocation; heading: number }) => void
  setViewport: (viewport: { width: number; height: number }) => void
  setDeviceStatus: (status: { isOutsideBoundary: boolean; distanceFromBoundary: number; closestBoundaryPoint?: GeoLocation }) => void
  setScanner: (scanner: { radius: number }) => void
  setCanvas: (canvas: { size: { width: number; height: number }; boundary: GeoBoundary; image?: string | undefined }) => void
  setRadius: (radius: { center: { lat: number; lon: number }; radius: number; innerRadius: number }) => void
  setPreviewClues: (clues: Clue[]) => void
  setScannedClues: (clues: Clue[]) => void
  setSpots: (spots: DiscoverySpot[]) => void
  setTappedSpot: (spot: DiscoverySpot | undefined) => void
  setSnap: (snap: { startPoint: GeoLocation; endPoint: GeoLocation; intensity: number }) => void
  setStatus: (status: 'uninitialized' | 'loading' | 'ready' | 'error') => void
  setTrailId: (trailId: string) => void
  setBoundary: (boundary: GeoBoundary) => void
  setRegion: (region: { center: { lat: number; lon: number }; radius: number; innerRadius: number }) => void
  setMapLayer: (layer: 'CANVAS' | 'OVERVIEW') => void
  setViewportTransform: (transform: { scale: SharedValue<number>; translationX: SharedValue<number>; translationY: SharedValue<number> }) => void
}

export const useMapStore = create<MapState & MapStateActions>(set => ({
  status: 'uninitialized', // Initial status

  // Dynamics in UI State - changes frequently
  compass: { heading: 0, direction: 'N' },
  device: {
    location: { lat: 0, lon: 0 },
    heading: 0,
  },
  mapLayer: 'CANVAS',
  viewportTransform: {
    scale: null,
    translationX: null,
    translationY: null,
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
  boundary: { northEast: { lat: 0, lon: 0 }, southWest: { lat: 0, lon: 0 } }, // Default boundary
  scale: 1,
  region: {
    center: { lat: 0, lon: 0 }, // Center of the radius
    radius: 1000, // Default radius in meters
    innerRadius: 500, // Default inner radius in meters
  },
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
  setCompass: (compass: { heading: number; direction: string }) =>
    set(state => (state.compass.heading !== compass.heading || state.compass.direction !== compass.direction ? { compass } : state)),
  setDevice: (device: { location: GeoLocation; heading: number }) =>
    set(state =>
      state.device.location.lat !== device.location.lat || state.device.location.lon !== device.location.lon || state.device.heading !== device.heading ? { device } : state
    ),
  setCanvas: (canvas: { size: { width: number; height: number }; image?: string | undefined }) =>
    set(state => (deepEqual(state.canvas, { ...state.canvas, ...canvas }) ? state : { canvas: { ...state.canvas, ...canvas } })),
  setRadius: (region: { center: { lat: number; lon: number }; radius: number; innerRadius: number }) => set(state => (deepEqual(state.region, region) ? state : { region })),
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
  setMapLayer: (mapLayer: 'CANVAS' | 'OVERVIEW') => set(state => (state.mapLayer !== mapLayer ? { mapLayer } : state)),
  setRegion: (region: { center: { lat: number; lon: number }; radius: number; innerRadius: number }) => set(state => (deepEqual(state.region, region) ? state : { region })),
  setViewportTransform: (viewportTransform: { scale: SharedValue<number>; translationX: SharedValue<number>; translationY: SharedValue<number> }) =>
    set({ viewportTransform }),
}))

export const getMapStoreActions = () => ({
  setState: useMapStore.getState().setState,
  setScale: useMapStore.getState().setScale,
  setCompass: useMapStore.getState().setCompass,
  setDevice: useMapStore.getState().setDevice,
  setViewport: useMapStore.getState().setViewport,
  setDeviceStatus: useMapStore.getState().setDeviceStatus,
  setScanner: useMapStore.getState().setScanner,
  setCanvas: useMapStore.getState().setCanvas,
  setRadius: useMapStore.getState().setRadius,
  setBoundary: useMapStore.getState().setBoundary,
  setPreviewClues: useMapStore.getState().setPreviewClues,
  setScannedClues: useMapStore.getState().setScannedClues,
  setSpots: useMapStore.getState().setSpots,
  setTappedSpot: useMapStore.getState().setTappedSpot,
  setSnap: useMapStore.getState().setSnap,
  setTrailId: useMapStore.getState().setTrailId,
  setStatus: useMapStore.getState().setStatus,
  setRegion: useMapStore.getState().setRegion,
})

// Granular hooks for volatile data
export const useMapScale = () => useMapStore(state => state.scale)
export const useMapCompass = () => useMapStore(state => state.compass)
export const useMapDevice = () => useMapStore(state => state.device)
export const useMapViewport = () => useMapStore(state => state.viewport)
export const useMapRadius = () => useMapStore(state => state.region)
export const useMapTrailId = () => useMapStore(state => state.trailId)
export const useMapLayer = () => useMapStore(state => state.mapLayer)

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
export const useSetCompass = () => useMapStore(state => state.setCompass)
export const useSetDevice = () => useMapStore(state => state.setDevice)
export const useSetViewport = () => useMapStore(state => state.setViewport)
export const useSetDeviceStatus = () => useMapStore(state => state.setDeviceStatus)
export const useSetScanner = () => useMapStore(state => state.setScanner)
export const useSetCanvas = () => useMapStore(state => state.setCanvas)
export const useSetRadius = () => useMapStore(state => state.setRadius)
export const useSetPreviewClues = () => useMapStore(state => state.setPreviewClues)
export const useSetScannedClues = () => useMapStore(state => state.setScannedClues)
export const useSetSpots = () => useMapStore(state => state.setSpots)
export const useSetTappedSpot = () => useMapStore(state => state.setTappedSpot)
export const useSetSnap = () => useMapStore(state => state.setSnap)
export const useSetMapLayer = () => useMapStore(state => state.setMapLayer)

export const getMapState = () => useMapStore.getState()
