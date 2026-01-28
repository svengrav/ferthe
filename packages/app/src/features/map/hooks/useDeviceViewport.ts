import { GeoBoundary, GeoLocation } from '@shared/geo'
import { mapUtils } from '../utils/geoToScreenTransform.'

interface DeviceViewportConfig {
  deviceLocation: GeoLocation
  radiusMeters?: number
  canvasSize?: { width: number; height: number }
}

interface DeviceViewportData {
  boundary: GeoBoundary
  canvasSize: { width: number; height: number }
  radiusMeters: number
}

const DEFAULT_RADIUS = 1000 // meters
const DEFAULT_CANVAS_SIZE = { width: 1000, height: 1000 } // pixels

/**
 * Hook to manage device-centered viewport
 * 
 * Calculates geographic boundary around device location
 * Maps 1000m radius to 1000x1000 pixel canvas by default
 * 
 * Independent of Map component - pure viewport logic
 */
export const useDeviceViewport = (config: DeviceViewportConfig): DeviceViewportData => {
  const {
    deviceLocation,
    radiusMeters = DEFAULT_RADIUS,
    canvasSize = DEFAULT_CANVAS_SIZE,
  } = config

  // Calculate geographic boundary
  const boundary = mapUtils.calculateDeviceViewportBoundary(deviceLocation, radiusMeters)

  return {
    boundary,
    canvasSize,
    radiusMeters,
  }
}
