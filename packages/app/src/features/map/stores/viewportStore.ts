import { GeoBoundary, GeoLocation } from '@shared/geo'
import { SharedValue } from 'react-native-reanimated'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

export interface ViewportState {
  status: 'uninitialized' | 'ready'

  // Primitive values (JS-Thread accessible)
  scale: number
  translationX: number
  translationY: number

  // SharedValue references (UI-Thread)
  sharedValues: {
    scale: SharedValue<number> | null
    translationX: SharedValue<number> | null
    translationY: SharedValue<number> | null
  }

  // Viewport dimensions
  width: number
  height: number

  // Viewport context (geo-specific data)
  deviceLocation: GeoLocation
  radiusMeters: number
  boundary: GeoBoundary
}

export interface ViewportActions {
  setStatus: (status: 'uninitialized' | 'ready') => void
  setViewportDimensions: (width: number, height: number) => void
  setViewportValues: (scale: number, translationX: number, translationY: number) => void
  setSharedValues: (scale: SharedValue<number>, translationX: SharedValue<number>, translationY: SharedValue<number>) => void
  setViewportContext: (deviceLocation: GeoLocation, radiusMeters: number, boundary: GeoBoundary) => void
}

export const viewportStore = create<ViewportState & ViewportActions>(set => ({
  // Initial state
  status: 'uninitialized',
  scale: 1,
  translationX: 0,
  translationY: 0,
  sharedValues: {
    scale: null,
    translationX: null,
    translationY: null,
  },
  width: 0,
  height: 0,
  deviceLocation: { lat: 0, lon: 0 },
  radiusMeters: 1000,
  boundary: { northEast: { lat: 0, lon: 0 }, southWest: { lat: 0, lon: 0 } },

  // Actions
  setStatus: status => set({ status }),

  setViewportDimensions: (width, height) =>
    set(state => (state.width !== width || state.height !== height ? { width, height } : state)),

  setViewportValues: (scale, translationX, translationY) =>
    set(state =>
      state.scale !== scale || state.translationX !== translationX || state.translationY !== translationY
        ? { scale, translationX, translationY }
        : state
    ),

  setSharedValues: (scale, translationX, translationY) =>
    set({ sharedValues: { scale, translationX, translationY }, status: 'ready' }),

  setViewportContext: (deviceLocation, radiusMeters, boundary) =>
    set(state => {
      // Deep equality check to prevent unnecessary updates
      const locationChanged =
        state.deviceLocation.lat !== deviceLocation.lat ||
        state.deviceLocation.lon !== deviceLocation.lon
      const radiusChanged = state.radiusMeters !== radiusMeters
      const boundaryChanged =
        state.boundary.northEast.lat !== boundary.northEast.lat ||
        state.boundary.northEast.lon !== boundary.northEast.lon ||
        state.boundary.southWest.lat !== boundary.southWest.lat ||
        state.boundary.southWest.lon !== boundary.southWest.lon

      if (locationChanged || radiusChanged || boundaryChanged) {
        return { deviceLocation, radiusMeters, boundary }
      }
      return state
    }),
}))

// Hook selectors
export const useViewportStatus = () => viewportStore(state => state.status)
export const useViewportScale = () => viewportStore(state => state.scale)
export const useViewportCompensationScale = () => {
  const scale = viewportStore(state => state.scale)
  return 1 / scale
}
export const useViewportTranslation = () => viewportStore(useShallow(state => ({ x: state.translationX, y: state.translationY })))
export const useViewportValues = () => viewportStore(useShallow(state => ({ scale: state.scale, translationX: state.translationX, translationY: state.translationY })))
export const useViewportDimensions = () => viewportStore(useShallow(state => ({ width: state.width, height: state.height })))
export const useViewportSharedValues = () => viewportStore(state => state.sharedValues)
export const useViewportContext = () => viewportStore(useShallow(state => ({ deviceLocation: state.deviceLocation, radiusMeters: state.radiusMeters, boundary: state.boundary })))
export const useViewportBoundary = () => viewportStore(state => state.boundary)
export const useViewportDeviceLocation = () => viewportStore(state => state.deviceLocation)

// Direct state access (outside React)
export const getViewportValues = () => {
  const state = viewportStore.getState()
  return { scale: state.scale, translationX: state.translationX, translationY: state.translationY }
}

export const getViewportSharedValues = () => viewportStore.getState().sharedValues

export const getViewportContext = () => {
  const state = viewportStore.getState()
  return { deviceLocation: state.deviceLocation, radiusMeters: state.radiusMeters, boundary: state.boundary }
}

export const getViewportActions = () => ({
  setStatus: viewportStore.getState().setStatus,
  setViewportDimensions: viewportStore.getState().setViewportDimensions,
  setViewportValues: viewportStore.getState().setViewportValues,
  setSharedValues: viewportStore.getState().setSharedValues,
  setViewportContext: viewportStore.getState().setViewportContext,
})
