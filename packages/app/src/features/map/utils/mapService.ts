import { logger } from '@app/shared/utils/logger'
import { Spot } from '@shared/contracts'
import { GeoBoundary, GeoLocation, geoUtils } from '@shared/geo'
import { Direction, DIRECTIONS, MapCompass } from '../types/compass'
import { DeviceBoundaryStatus, ZOOM_MODE_CONFIG, ZoomMode } from '../types/map'

export const mapService = {
  /**
   * Calculate optimal canvas size based on boundary aspect ratio
   * @param boundary Geographic boundary
   * @param maxSize Maximum size for the longer dimension (default: 1000)
   * @returns Canvas size that preserves boundary aspect ratio
   */
  calculateCanvasSize: (boundary: GeoBoundary, maxSize: number = 1000): { width: number; height: number } => {
    // Calculate geographic spans
    const latSpan = boundary.northEast.lat - boundary.southWest.lat
    const avgLat = (boundary.northEast.lat + boundary.southWest.lat) / 2
    const lonSpan = boundary.northEast.lon - boundary.southWest.lon

    // Convert to meters to get true aspect ratio
    const latMeters = latSpan * 111000 // ~111km per degree latitude
    const lonMeters = lonSpan * 111000 * Math.cos(avgLat * Math.PI / 180) // adjusted for latitude

    // Calculate aspect ratio
    const aspectRatio = lonMeters / latMeters

    let width: number
    let height: number

    if (aspectRatio >= 1) {
      // Wider than tall
      width = maxSize
      height = Math.round(maxSize / aspectRatio)
    } else {
      // Taller than wide
      height = maxSize
      width = Math.round(maxSize * aspectRatio)
    }

    // Ensure minimum size
    width = Math.max(width, 300)
    height = Math.max(height, 300)

    return { width, height }
  },

  /**
   * Calculate meters per pixel for a given boundary and viewport width
   * @param boundary Geographic boundary
   * @param viewportWidth Width of viewport in pixels
   * @returns Meters per pixel ratio
   */
  calculateMetersPerPixel: (boundary: GeoBoundary, viewportWidth: number): number => {
    if (viewportWidth <= 0) {
      logger.warn('calculateMetersPerPixel: invalid viewportWidth', viewportWidth)
      return 1000 // Fallback: ~1km per pixel
    }

    const westPoint = { lat: (boundary.northEast.lat + boundary.southWest.lat) / 2, lon: boundary.southWest.lon }
    const eastPoint = { lat: (boundary.northEast.lat + boundary.southWest.lat) / 2, lon: boundary.northEast.lon }
    const boundaryWidthMeters = geoUtils.calculateDistance(westPoint, eastPoint)

    return boundaryWidthMeters / viewportWidth
  },

  /**
   * Get trail boundary from backend-calculated boundary
   * @param trail Trail object with boundary
   * @returns Geographic boundary
   */
  getTrailBoundary: (trail: { boundary?: GeoBoundary } | undefined, _spots: Spot[]): GeoBoundary => {
    if (!trail?.boundary) {
      logger.error('Trail missing boundary - Backend must calculate on create/update')
      // Fallback: minimal valid boundary around null island
      return {
        northEast: { lat: 0.1, lon: 0.1 },
        southWest: { lat: -0.1, lon: -0.1 },
      }
    }

    return trail.boundary
  },

  /**
   * Evaluate zoom mode based on visible map width with hysteresis protection
   * @param metersPerPixel Current meters per pixel ratio
   * @param viewportWidth Width of viewport in pixels
   * @param currentMode Current zoom mode (for hysteresis)
   * @returns New zoom mode
   */
  evaluateZoomMode: (metersPerPixel: number, viewportWidth: number, currentMode: ZoomMode): ZoomMode => {
    const visibleWidthKm = (metersPerPixel * viewportWidth) / 1000

    // Apply hysteresis: different thresholds depending on current mode
    if (currentMode === 'NAV') {
      // When in NAV mode, need to exceed NAV_TO_OVERVIEW threshold to switch
      return visibleWidthKm > ZOOM_MODE_CONFIG.NAV_TO_OVERVIEW_KM ? 'OVERVIEW' : 'NAV'
    } else {
      // When in OVERVIEW mode, need to go below OVERVIEW_TO_NAV threshold to switch
      return visibleWidthKm < ZOOM_MODE_CONFIG.OVERVIEW_TO_NAV_KM ? 'NAV' : 'OVERVIEW'
    }
  },

  /**
   * Calculate target scale for zoom mode transition
   * @param targetMode Target zoom mode
   * @param boundary Trail boundary
   * @param viewport Viewport dimensions
   * @param canvas Canvas configuration
   * @returns Target scale value
   */
  calculateZoomTransitionScale: (
    targetMode: ZoomMode,
    boundary: GeoBoundary,
    viewport: { width: number; height: number },
    canvas: { scale: { init: number; min: number; max: number } }
  ): number => {
    if (targetMode === 'OVERVIEW') {
      // Calculate scale to fit entire boundary
      const boundaryWidth = Math.abs(boundary.northEast.lon - boundary.southWest.lon)
      const boundaryHeight = Math.abs(boundary.northEast.lat - boundary.southWest.lat)

      // Rough approximation for scale calculation
      const scaleX = viewport.width / (boundaryWidth * 100)
      const scaleY = viewport.height / (boundaryHeight * 100)

      return Math.max(
        canvas.scale.min,
        Math.min(canvas.scale.max, Math.min(scaleX, scaleY) * 0.6)
      )
    } else {
      // NAV mode: use init scale for detailed navigation
      return canvas.scale.init
    }
  },

  getCompass: (heading: number): MapCompass => {
    const normalizedHeading = Math.round(((heading % 360) + 360) % 360)
    const getCardinalDirection = (heading: number): Direction => {
      const index = Math.round(heading / 22.5) % 16
      return DIRECTIONS[index]
    }

    return {
      heading: normalizedHeading,
      direction: getCardinalDirection(normalizedHeading),
    }
  },

  calculateOptimalScale: (mapSize: { width: number; height: number }, containerSize: { width: number; height: number }) => {
    const scaleToFit = Math.min(containerSize.width / mapSize.width, containerSize.height / mapSize.height)
    return {
      init: scaleToFit,
      min: scaleToFit * 0.9, // 50% vom Fit-Scale
      max: scaleToFit * 4, // 400% vom Fit-Scale
    }
  },

  calculateDeviceBoundaryStatus: (deviceLocation: GeoLocation | undefined, boundary: GeoBoundary): DeviceBoundaryStatus => {
    if (!deviceLocation) {
      return {
        isOutsideBoundary: false,
        distanceFromBoundary: 0,
      }
    }

    const isInside = geoUtils.isCoordinateInBounds(deviceLocation, boundary)
    if (isInside) {
      return {
        isOutsideBoundary: false,
        distanceFromBoundary: 0,
      }
    } else {
      const { closestPoint, distance } = geoUtils.calculateDistanceToBoundary(deviceLocation, boundary)
      return {
        isOutsideBoundary: true,
        distanceFromBoundary: distance,
        closestBoundaryPoint: closestPoint,
      }
    }
  },

  calculateMapSnap: (spots: Spot[], deviceLocation: GeoLocation | undefined, snapIntensity?: number, lastDiscoverySpotLocation?: GeoLocation) => {
    return {
      startPoint: lastDiscoverySpotLocation ?? spots.at(-1)?.location ?? deviceLocation ?? { lat: 0, lon: 0 },
      endPoint: deviceLocation ?? { lat: 0, lon: 0 },
      intensity: snapIntensity ?? 0,
    }
  },

  /**
   * Calculate canvas offset to center user position on screen
   * Returns translation values that place the device location at canvas center
   * @param deviceLocation Current device GPS location
   * @param boundary Trail boundary (geographic)
   * @param canvasSize Canvas dimensions in pixels
   * @returns Translation offset { x, y } in pixels
   */
  calculateUserCenteredOffset: (
    deviceLocation: GeoLocation | undefined,
    boundary: GeoBoundary,
    canvasSize: { width: number; height: number }
  ): { x: number; y: number } => {
    if (!deviceLocation) {
      return { x: 0, y: 0 }
    }

    // Convert device location to canvas position (0 to canvasSize)
    const latRange = boundary.northEast.lat - boundary.southWest.lat
    const lonRange = boundary.northEast.lon - boundary.southWest.lon

    if (latRange === 0 || lonRange === 0) {
      return { x: 0, y: 0 }
    }

    // Normalize device position within boundary (0-1)
    const normalizedX = (deviceLocation.lon - boundary.southWest.lon) / lonRange
    const normalizedY = (boundary.northEast.lat - deviceLocation.lat) / latRange // Inverted for screen coords

    // Convert to canvas pixels
    const deviceCanvasX = normalizedX * canvasSize.width
    const deviceCanvasY = normalizedY * canvasSize.height

    // Calculate offset to center device (canvas center - device position)
    const centerX = canvasSize.width / 2
    const centerY = canvasSize.height / 2

    return {
      x: centerX - deviceCanvasX,
      y: centerY - deviceCanvasY,
    }
  },

  /**
   * Clamp boundary to max radius around user position
   * Returns the smaller of: trail boundary or circle around user
   * @param trailBoundary Original trail boundary
   * @param deviceLocation Current device GPS location
   * @param maxRadiusMeters Maximum radius in meters (default: 5000 = 5km)
   * @returns Clamped boundary - either trail bounds or user-centered circle
   */
  clampBoundaryToRadius: (
    trailBoundary: GeoBoundary,
    deviceLocation: GeoLocation | undefined,
    maxRadiusMeters: number = 5000
  ): GeoBoundary => {
    if (!deviceLocation) {
      return trailBoundary
    }

    // Calculate trail boundary size in meters
    const trailWidthMeters = geoUtils.calculateDistance(
      { lat: (trailBoundary.northEast.lat + trailBoundary.southWest.lat) / 2, lon: trailBoundary.southWest.lon },
      { lat: (trailBoundary.northEast.lat + trailBoundary.southWest.lat) / 2, lon: trailBoundary.northEast.lon }
    )
    const trailHeightMeters = geoUtils.calculateDistance(
      { lat: trailBoundary.southWest.lat, lon: (trailBoundary.northEast.lon + trailBoundary.southWest.lon) / 2 },
      { lat: trailBoundary.northEast.lat, lon: (trailBoundary.northEast.lon + trailBoundary.southWest.lon) / 2 }
    )

    // If trail fits within max radius, use trail boundary
    const trailMaxDimension = Math.max(trailWidthMeters, trailHeightMeters)
    if (trailMaxDimension <= maxRadiusMeters * 2) {
      return trailBoundary
    }

    // Trail is larger than max radius - create user-centered boundary
    // Convert radius to degrees (approximate)
    const latDegreesPerMeter = 1 / 111000 // ~111km per degree latitude
    const lonDegreesPerMeter = 1 / (111000 * Math.cos(deviceLocation.lat * Math.PI / 180))

    const latOffset = maxRadiusMeters * latDegreesPerMeter
    const lonOffset = maxRadiusMeters * lonDegreesPerMeter

    return {
      northEast: {
        lat: deviceLocation.lat + latOffset,
        lon: deviceLocation.lon + lonOffset,
      },
      southWest: {
        lat: deviceLocation.lat - latOffset,
        lon: deviceLocation.lon - lonOffset,
      },
    }
  },
}

export const getMapService = () => mapService
