// Public API for map feature
export { MapCanvas } from './components/MapCanvas.tsx'
export { createMapApplication, type MapApplication } from './mapApplication'

// Hooks - State
export {
  useDeviceBoundaryStatus, useMapCanvas,
  useMapCanvasContext,
  useMapCanvasDimensions,
  useMapCanvasScale,
  useMapCanvasValues, useMapCompass,
  useMapDevice,
  useMapLayer,
  useMapOverview,
  useMapScanner,
  useMapSnap,
  useMapStatus,
  useMapSurface,
  useMapSurfaceBoundary,
  useMapSurfaceLayout
} from './stores/mapStore'

// Hooks - Derived (from Context)
export { useMapCompensatedScale } from './components/surface/MapCompensatedScale'

// Hooks - Actions
export { useSetActiveLayer } from './stores/mapStore'

// Non-React access
export { getMapCanvasActions, getMapCanvasContext, getMapCanvasValues, getMapState, getMapStoreActions } from './stores/mapStore'

// Types
export type { MapActions, MapState } from './stores/mapStore'

// Utils
export { mapUtils } from './utils/geoToScreenTransform'
export { mapService } from './utils/mapService'

