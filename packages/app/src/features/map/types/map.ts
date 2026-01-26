import { Clue, DiscoverySpot } from '@shared/contracts'
import { GeoBoundary, GeoLocation } from '@shared/geo'

// Earth constants
export const EARTH_CONSTANTS = {
  // Earth radius in kilometers
  RADIUS_KM: 6371,
  // Earth radius in meters
  RADIUS_M: 6371000,
  // Meters per degree at equator
  METERS_PER_DEGREE: 111000,
}

// Zoom modes for map interaction
export type ZoomMode = 'NAV' | 'OVERVIEW'

// Map layer modes - distinct view modes with different behavior
export type MapLayer = 'CANVAS' | 'OVERVIEW'

// Map layer configuration
export const MAP_LAYER_CONFIG = {
  // Default layer
  DEFAULT_LAYER: 'CANVAS' as MapLayer,
  // Padding for fitBounds in Overview mode (pixels)
  OVERVIEW_PADDING: 40,
  // Zoom corridor in Overview mode (how much user can zoom from fitBounds)
  OVERVIEW_ZOOM_CORRIDOR: 0.3, // ±30% from fit scale
}

// Zoom mode thresholds and constants
export const ZOOM_MODE_CONFIG = {
  // Threshold for switching from NAV to OVERVIEW (in kilometers of visible map width)
  NAV_TO_OVERVIEW_KM: 5,
  // Threshold for switching from OVERVIEW to NAV (in kilometers) - hysteresis protection
  OVERVIEW_TO_NAV_KM: 4,
  // Default mode
  DEFAULT_MODE: 'NAV' as ZoomMode,
}

export const MAP_SPECIFICATION_DEFAULTS = {
  // Standard map dimensions
  MAP_HEIGHT: 1000,
  MAP_WIDTH: 1000,
  // Standard container dimensions
  MAP_CONTAINER_WIDTH: 600,
  MAP_CONTAINER_HEIGHT: 600,
  // Default map radius in meters
  MAP_RADIUS: 3000,
  MAP_DEFAULT_PADDING: 50,
  // Default scale settings
  MAP_SCALE: {
    current: 1,
    min: 0.5,
    max: 4,
  },
  // Default snap settings
  MAP_SNAP: {
    startPoint: { lat: 0, lon: 0 },
    endPoint: { lat: 0, lon: 0 },
    intensity: 0,
  },
}

export interface DeviceBoundaryStatus {
  isOutsideBoundary: boolean
  distanceFromBoundary: number // Distance in meters, 0 if inside, positive if outside
  closestBoundaryPoint?: GeoLocation // The closest point on the boundary
}

export interface MapState {
  status: 'uninitialized' | 'loading' | 'ready' | 'error'
  zoomMode: ZoomMode
  mapLayer: MapLayer
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
  followMode: boolean
  panOffset: { x: number; y: number }

  // discovery data
  trailId: string // Optional trail ID for discovery context
  previewClues: Clue[]
  scannedClues: Clue[]
  spots: DiscoverySpot[]
}

export interface MapSpecification {
  /**
   * This is the radius of the trail boundary for this ma in meters
   */
  radius: number

  /**
   * This is the geo boundary of the whole map (radius + padding).
   */
  boundary: GeoBoundary

  /**
   * This is the size of the map surface in pixels (1000x1000)
   * This gets transformed and scaled based on the container size (device viewport).
   */
  mapSize: {
    width: number
    height: number
  }

  /** This is the size of the container (usually the viewport as part of user interface) in pixels (variable)
   * Its calculated based on the user device.
   */
  containerSize: {
    width: number
    height: number
  }

  /**
   * This is the scale of the map.
   * Its calculated based on the container size and the map size.
   * In min scale the whole map fits into the container.
   * In max scale the map is zoomed in 4x.
   */
  scale: {
    init: number
    min: number
    max: number
  }
}

export const MAP_DEFAULT: MapSpecification = {
  radius: 3000,
  boundary: {
    northEast: { lat: 0, lon: 0 },
    southWest: { lat: 0, lon: 0 },
  },
  mapSize: {
    width: 1000,
    height: 1000,
  },
  containerSize: {
    width: 550,
    height: 550,
  },
  scale: {
    init: 1,
    min: 0.5,
    max: 4,
  },
}

const getDefaultMapState = (): MapState => ({
  status: 'uninitialized',
  zoomMode: ZOOM_MODE_CONFIG.DEFAULT_MODE,
  mapLayer: MAP_LAYER_CONFIG.DEFAULT_LAYER,
  boundary: MAP_DEFAULT.boundary,
  trailBoundary: MAP_DEFAULT.boundary,
  canvas: {
    size: {
      width: MAP_DEFAULT.mapSize.width,
      height: MAP_DEFAULT.mapSize.height,
    },
    scale: {
      init: MAP_DEFAULT.scale.init,
      min: MAP_DEFAULT.scale.min,
      max: MAP_DEFAULT.scale.max,
    },
    image: undefined, // Optional map image
  },
  scanner: {
    radius: MAP_DEFAULT.radius,
  },
  snap: {
    startPoint: { lat: 0, lon: 0 },
    endPoint: { lat: 0, lon: 0 },
    intensity: 0,
  },
  viewport: MAP_DEFAULT.containerSize,
  scale: MAP_DEFAULT.scale.init,
  compass: { heading: 0, direction: 'N' },
  device: { location: { lat: 0, lon: 0 }, heading: 0 },
  previewClues: [],
  scannedClues: [],
  spots: [],
  trailId: '',
  deviceStatus: {
    isOutsideBoundary: false,
    distanceFromBoundary: 0,
  },
  followMode: true,
  panOffset: { x: 0, y: 0 },
})

export const createMapState = (configure?: (defaults: MapState) => Partial<MapState>): MapState => {
  const defaults = getDefaultMapState()

  if (!configure) {
    return defaults
  }

  const overrides = configure(defaults)
  return { ...defaults, ...overrides }
}
