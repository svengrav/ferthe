// Public API for map feature
export { Map } from './components/Map'
export { createMapApplication, type MapApplication } from './mapApplication'

// Hooks - State
export {
  useDeviceBoundaryStatus,
  useMapCompass,
  useMapDevice,
  useMapLayer,
  useMapOverlay,
  useMapScanner,
  useMapSnap,
  useMapSpotTap,
  useMapStatus,
  useMapSurface,
  useMapSurfaceBoundary,
  useMapSurfaceLayout,
  useMapViewport,
  useViewportContext,
  useViewportDimensions,
  useViewportScale,
  useViewportValues
} from './stores/mapStore'

// Hooks - Derived (from Context)
export { useCompensatedScale } from './components/MapViewport'

// Hooks - Actions
export { useSetActiveLayer, useSetTappedSpot } from './stores/mapStore'

// Non-React access
export { getMapState, getMapStoreActions, getViewportActions, getViewportContext, getViewportValues } from './stores/mapStore'

// Types
export type { MapActions, MapState } from './stores/mapStore'

// Utils
export { mapUtils } from './utils/geoToScreenTransform'
export { mapService } from './utils/mapService'

