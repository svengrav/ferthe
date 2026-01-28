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

export const mapUtils = {
  coordinatesToPosition,
  positionToCoordinates,
  calculateCircleDimensions,
  calculateScreenDimensions,
  metersToPixels,
  calculateDeviceViewportBoundary,
}
