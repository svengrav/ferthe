import { GeoBoundary, GeoLocation, geoUtils } from '@shared/geo'

// Default map content dimensions
const METERS_PER_DEGREE_LATITUDE = 111000
const DEVICE_VIEWPORT_RADIUS = 1000 // meters

interface ScreenSize {
  width: number
  height: number
}

interface ScreenPosition {
  x: number
  y: number
}

interface ScreenElement {
  width: number
  height: number
  left: number
  top: number
}

// Calculate conversion between geo coordinates and screen coordinates
const coordinatesToPosition = (location: GeoLocation, boundary: GeoBoundary, size: ScreenSize): ScreenPosition => {
  const { lat, lon } = location
  const { northEast, southWest } = boundary
  const { width, height } = size

  // Extract boundary values from MapBoundaries structure
  const north = northEast.lat
  const east = northEast.lon
  const south = southWest.lat
  const west = southWest.lon

  // Calculate the percentage position within boundaries
  const latPercent = (north - lat) / (north - south)
  const lngPercent = (lon - west) / (east - west)

  return {
    x: width * lngPercent,
    y: height * latPercent,
  }
}

/**
 * Calculates circle dimensions and position for displaying a radius around a point
 * @param location Center point location
 * @param radius Radius in meters
 * @param boundary Current map boundaries
 * @returns Circle dimensions and position in screen coordinates
 */
const calculateCircleDimensions = (location: GeoLocation, radius: number, boundary: GeoBoundary, size: ScreenSize): ScreenElement => {
  // Calculate the center point in screen coordinates
  const centerPoint = coordinatesToPosition(location, boundary, size)

  // Calculate a point that is 'radius' meters north of the center
  const radiusPoint = {
    lat: location.lat + radius / METERS_PER_DEGREE_LATITUDE, // 111km per degree of latitude
    lon: location.lon,
  }

  // Get the screen coordinates of this point
  const radiusScreenPoint = coordinatesToPosition(radiusPoint, boundary, size)

  // Calculate the pixel distance between the center and radius point
  // This will be the radius in pixels
  const radiusInPixels = Math.abs(centerPoint.y - radiusScreenPoint.y)

  const diameter = radiusInPixels * 2

  return {
    width: diameter,
    height: diameter,
    left: centerPoint.x - radiusInPixels,
    top: centerPoint.y - radiusInPixels,
  }
}

/**
 * Calculates box dimensions and position for displaying a rectangular area around a point
 * @param location Center point location
 * @param size Height and width in meters
 * @param boundary Current map boundaries
 * @returns Box dimensions and position in screen coordinates
 */
const calculateScreenDimensions = (location: GeoLocation, size: ScreenSize, boundary: GeoBoundary): ScreenElement => {
  const { lat, lon } = location
  const { width, height } = size
  const centerPoint = coordinatesToPosition(location, boundary, size)

  const eastPoint = {
    lat: lat,
    lon: lon + width / 2 / (111320 * Math.cos(lat * (Math.PI / 180))),
  }

  const northPoint = {
    lat: lat - height / 2 / 111320,
    lon: lon,
  }

  const eastScreenPoint = coordinatesToPosition(eastPoint, boundary, size)
  const northScreenPoint = coordinatesToPosition(northPoint, boundary, size)

  const halfWidthPixels = Math.abs(centerPoint.x - eastScreenPoint.x)
  const halfHeightPixels = Math.abs(centerPoint.y - northScreenPoint.y)

  const widthPixels = halfWidthPixels * 2
  const heightPixels = halfHeightPixels * 2

  return {
    width: widthPixels,
    height: heightPixels,
    left: centerPoint.x - halfWidthPixels,
    top: centerPoint.y - halfHeightPixels,
  }
}

/**
 * Convert geographic measurement to pixels based on map boundaries
 * @param location Center location
 * @param boundary Current map boundaries
 * @param meters Size in meters
 * @param contentWidth Width of the content area in pixels
 * @returns Size in pixels
 */
const metersToPixels = (location: GeoLocation, boundary: GeoBoundary, meters: number, contentWidth: number = 500): number => {
  const mapWidthDegrees = boundary.northEast.lon - boundary.southWest.lon
  const metersPerDegree = 111000 * Math.cos(geoUtils.toRadians(location.lat))
  const mapWidthMeters = mapWidthDegrees * metersPerDegree

  const pixelsPerMeter = contentWidth / mapWidthMeters
  return meters * pixelsPerMeter
}

// Inverse function: convert screen position to geo coordinates
const positionToCoordinates = (position: ScreenPosition, boundary: GeoBoundary, size: ScreenSize): GeoLocation => {
  const { x, y } = position
  const { width, height } = size
  const { northEast, southWest } = boundary

  const north = northEast.lat
  const east = northEast.lon
  const south = southWest.lat
  const west = southWest.lon

  // Convert screen position to percentage
  const lngPercent = x / width
  const latPercent = y / height

  // Convert back to geo coordinates
  const lon = west + (east - west) * lngPercent
  const lat = north - (north - south) * latPercent

  return { lat, lon }
}

/**
 * Calculate device-centered viewport boundary
 * @param deviceLocation Current device location
 * @param radiusMeters Viewport radius in meters (default 1000m)
 * @returns GeoBoundary centered on device
 */
const calculateDeviceViewportBoundary = (deviceLocation: GeoLocation, radiusMeters: number = DEVICE_VIEWPORT_RADIUS): GeoBoundary => {
  return geoUtils.calculateBoundaries(deviceLocation, radiusMeters)
}

/**
 * Calculate adaptive viewport radius based on trail size
 * @param trailBoundary Trail boundary to analyze
 * @param maxRadius Maximum allowed radius (default 1000m)
 * @param paddingFactor Extra space around trail (default 1.2 = 20% padding)
 * @returns Optimal radius between reasonable minimum and maxRadius
 */
const calculateAdaptiveViewportRadius = (
  trailBoundary: GeoBoundary,
  maxRadius: number = DEVICE_VIEWPORT_RADIUS,
  paddingFactor: number = 1.5
): number => {
  // Calculate trail dimensions using geoUtils
  const centerLat = (trailBoundary.northEast.lat + trailBoundary.southWest.lat) / 2
  const trailDimensions = geoUtils.calculateBoundaryDimensions(trailBoundary, centerLat)

  if (!trailDimensions?.meters) {
    return maxRadius // Fallback to maximum if calculation fails
  }

  // Take the larger dimension and add padding
  const trailSize = Math.max(trailDimensions.meters.width, trailDimensions.meters.height)
  const suggestedRadius = (trailSize / 2) * paddingFactor

  // Ensure minimum usability (200m minimum) and respect maximum limit
  return Math.min(Math.max(suggestedRadius, 200), maxRadius)
}

/**
 * Calculate surface layout position and dimensions within a viewport
 * @param surfaceBoundary The boundary of the surface/trail
 * @param viewportBoundary The viewport boundary
 * @param viewportSize The viewport pixel dimensions
 */
const calculateSurfaceLayout = (
  surfaceBoundary: GeoBoundary,
  viewportBoundary: GeoBoundary,
  viewportSize: ScreenSize
): { left: number; top: number; width: number; height: number } => {
  const topLeft = coordinatesToPosition(
    { lat: surfaceBoundary.northEast.lat, lon: surfaceBoundary.southWest.lon },
    viewportBoundary,
    viewportSize
  )
  const bottomRight = coordinatesToPosition(
    { lat: surfaceBoundary.southWest.lat, lon: surfaceBoundary.northEast.lon },
    viewportBoundary,
    viewportSize
  )
  return {
    left: topLeft.x,
    top: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  }
}

/**
 * Calculate meters per pixel for a given boundary and canvas size
 * @param boundary Geographic boundary
 * @param canvasSize Canvas dimensions in pixels
 * @returns Meters per pixel
 */
const calculateMetersPerPixel = (boundary: GeoBoundary, canvasSize: ScreenSize): number => {
  const centerLat = (boundary.northEast.lat + boundary.southWest.lat) / 2
  const dimensions = geoUtils.calculateBoundaryDimensions(boundary, centerLat)

  if (!dimensions?.meters) return 1

  const metersPerPixelWidth = dimensions.meters.width / canvasSize.width
  const metersPerPixelHeight = dimensions.meters.height / canvasSize.height

  return Math.max(metersPerPixelWidth, metersPerPixelHeight)
}

/**
 * Calculate zoom limits for overlay mode based on trail boundary and desired view
 * @param boundary Trail boundary
 * @param canvasSize Canvas size in pixels
 * @param screenSize Screen size in pixels
 * @param maxZoomMeters Maximum zoom level in meters (default 50m)
 * @returns Min and max scale values
 */
const calculateOverlayZoomLimits = (
  boundary: GeoBoundary,
  canvasSize: ScreenSize,
  screenSize: ScreenSize,
  maxZoomMeters: number = 50
): { min: number; max: number } => {
  const centerLat = (boundary.northEast.lat + boundary.southWest.lat) / 2
  const trailDimensions = geoUtils.calculateBoundaryDimensions(boundary, centerLat)

  if (!trailDimensions?.meters) {
    return { min: 0.8, max: 1.5 }
  }

  const trailMaxDimension = Math.max(trailDimensions.meters.width, trailDimensions.meters.height)
  const canvasMaxDimension = Math.max(canvasSize.width, canvasSize.height)
  const screenMinDimension = Math.min(screenSize.width, screenSize.height)

  // MIN_SCALE: Trail fits in screen with padding
  const paddingFactor = 0.95
  const minScale = (screenMinDimension * paddingFactor) / canvasMaxDimension

  // MAX_SCALE: Show max 50m of trail
  const metersPerPixel = trailMaxDimension / canvasMaxDimension
  const maxScale = trailMaxDimension / maxZoomMeters

  return {
    min: Math.max(0.5, minScale),
    max: Math.min(3.0, Math.max(1.0, maxScale))
  }
}

export const mapUtils = {
  coordinatesToPosition,
  positionToCoordinates,
  calculateCircleDimensions,
  calculateScreenDimensions,
  metersToPixels,
  calculateDeviceViewportBoundary,
  calculateAdaptiveViewportRadius,
  calculateSurfaceLayout,
  calculateMetersPerPixel,
  calculateOverlayZoomLimits,
}
