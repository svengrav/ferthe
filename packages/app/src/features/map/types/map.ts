import { GeoBoundary, GeoLocation, GeoRegion } from '@shared/geo'
import type { MapState } from '../stores/mapStore'

// Earth constants
export const EARTH_CONSTANTS = {
  // Earth radius in kilometers
  RADIUS_KM: 6371,
  // Earth radius in meters
  RADIUS_M: 6371000,
  // Meters per degree at equator
  METERS_PER_DEGREE: 111000,
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
   * This is the region of the whole map (radius + padding).
   */
  region: GeoRegion

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
  region: {
    center: { lat: 0, lon: 0 },
    radius: 3000,
  },
}

const getDefaultMapState = (): MapState => ({
  status: 'uninitialized',
  boundary: MAP_DEFAULT.boundary,
  region: {
    ...MAP_DEFAULT.region,
    innerRadius: 500, // Default inner radius in meters
  },
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
    distanceFromBoundary: 0, // Default to 0, meaning inside the boundary
  },
  mapLayer: 'CANVAS',
  tappedSpot: undefined,
  surfaceSize: { width: 0, height: 0 },
  viewportTransform: {
    scale: null,
    translationX: null,
    translationY: null,
  },
})

export const createMapState = (configure?: (defaults: MapState) => Partial<MapState>): MapState => {
  const defaults = getDefaultMapState()

  if (!configure) {
    return defaults
  }

  const overrides = configure(defaults)
  return { ...defaults, ...overrides }
}
