import { CARDINAL_DEGREES, CARDINAL_DIRECTION_NAMES, CARDINAL_DIRECTIONS, GeoBoundary, GeoDirection, GeoLocation } from './types.ts'

const EARTH_RADIUS = 6371e3 // Radius of the Earth in meters

export const formatGeoCoordinates = (lat: number, lon: number) => {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lon).toFixed(4)}° ${ew}`
}

/**
 * Calculate cardinal direction from one coordinate to another
 * @param origin Starting coordinate
 * @param destination Target coordinate
 * @returns Complete GeoDirection object with bearing and directions
 */
export const calculateDirection = (origin: GeoLocation, destination: GeoLocation): GeoDirection => {
  const { lat: lat1, lon: lon1 } = origin
  const { lat: lat2, lon: lon2 } = destination

  const y = Math.sin(lon2 - lon1) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
  const bearingRad = Math.atan2(y, x)
  let bearingDeg = ((bearingRad * 180) / Math.PI + 360) % 360

  // Calculate the nearest direction angle (0, 45, 90, 135, etc.)
  const directionIndex = Math.round(bearingDeg / 45) % 8
  const directionShort = CARDINAL_DIRECTIONS[directionIndex]
  const direction = CARDINAL_DEGREES[directionShort]
  const directionLong = CARDINAL_DIRECTION_NAMES[directionIndex]

  return {
    bearing: bearingDeg,
    direction,
    directionShort,
    directionLong,
  }
}

/**
 * Find the nearest point to a given location from an array of points
 * @param origin Current location point
 * @param points Array of possible target points
 * @returns Object containing index of nearest point and distance to it in km
 */
export const findNearestCoordinate = (origin: GeoLocation, points: GeoLocation[]): { index: number; distance: number } => {
  if (!points || points.length === 0) {
    return { index: -1, distance: Infinity }
  }

  let minDistance = Infinity
  let minIndex = 0

  points.forEach((point, index) => {
    const distance = calculateDistance(origin, point)
    if (distance < minDistance) {
      minDistance = distance
      minIndex = index
    }
  })

  return { index: minIndex, distance: minDistance }
}

/**
 * Compare two map points and return detailed comparison information
 * @param origin First map point with latitude and longitude
 * @param destination Second map point with latitude and longitude
 * @returns Distance in km, direction from origin to destination, and equality status
 */
const compareCoordinates = (
  origin: GeoLocation,
  destination: GeoLocation
): {
  equal: boolean
  distance: number
  direction: GeoDirection
} => {
  const epsilon = 0.000001 // ~0.1 meter precision
  const equal = Math.abs(origin.lat - destination.lat) < epsilon && Math.abs(origin.lon - destination.lon) < epsilon

  const distance = calculateDistance(origin, destination)
  const direction = calculateDirection(origin, destination)

  return {
    equal,
    distance,
    direction,
  }
}

/**
 * Calculates distance between two coordinates in meters using Haversine formula
 */
const calculateDistance = (origin: GeoLocation, destination: GeoLocation): number => {
  const { lat: lat1, lon: lon1 } = origin
  const { lat: lat2, lon: lon2 } = destination
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS * c
}

/**
 * Checks if a geographic point is within specified map boundaries
 * @param point The coordinate to check
 * @param boundary The map boundary defined by northEast and southWest coordinates
 * @returns Boolean indicating whether the point is within the boundaries
 */
const isCoordinateInBounds = (point: GeoLocation, boundary: GeoBoundary): boolean => {
  const { lat, lon } = point
  const { northEast, southWest } = boundary

  return lat >= southWest.lat && lat <= northEast.lat && lon >= southWest.lon && lon <= northEast.lon
}

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180)
}

/**
 * Convert radians to degrees
 * @param radians Angle in radians
 * @returns Angle in degrees
 */
const toDegrees = (radians: number): number => {
  return radians * (180 / Math.PI)
}

/**
 * Calculate bearing between two coordinates
 * @param origin Starting coordinate
 * @param destination Target coordinate
 * @returns Bearing in degrees (0-360)
 */
const calculateBearing = (origin: GeoLocation, destination: GeoLocation): number => {
  const { lat: lat1, lon: lon1 } = origin
  const { lat: lat2, lon: lon2 } = destination

  const lat1Rad = toRadians(lat1)
  const lat2Rad = toRadians(lat2)
  const lonDiff = toRadians(lon2 - lon1)

  const y = Math.sin(lonDiff) * Math.cos(lat2Rad)
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lonDiff)

  let bearing = Math.atan2(y, x)
  bearing = toDegrees(bearing)
  bearing = (bearing + 360) % 360 // Normalize to 0-360

  return bearing
}

/**
 * Convert bearing in degrees to cardinal direction
 * @param bearing Bearing in degrees
 * @returns Complete GeoDirection object
 */
const bearingToDirection = (bearing: number): GeoDirection => {
  const normalizedBearing = (bearing + 360) % 360
  const directionIndex = Math.round(normalizedBearing / 45) % 8
  const directionShort = CARDINAL_DIRECTIONS[directionIndex]
  const direction = CARDINAL_DEGREES[directionShort]
  const directionLong = CARDINAL_DIRECTION_NAMES[directionIndex]

  return {
    bearing,
    direction,
    directionShort,
    directionLong,
  }
}

/**
 * Calculates geographic boundaries based on center coordinates and radius
 * @param location Center coordinates
 * @param radius Radius in meters
 * @returns Geographic boundaries
 */
const calculateBoundaries = (location: GeoLocation, radius: number): GeoBoundary => {
  const radiusInKm = radius / 1000
  const latDegrees = radiusInKm / 111
  const longDegrees = radiusInKm / (111 * Math.cos(location.lat * (Math.PI / 180)))
  return {
    northEast: {
      lat: location.lat + latDegrees,
      lon: location.lon + longDegrees,
    },
    southWest: {
      lat: location.lat - latDegrees,
      lon: location.lon - longDegrees,
    },
  }
}

/**
 * Calculate bounding box from array of spots with antimeridian handling
 * @param spots Array of spots with locations
 * @param paddingMeters Optional padding in meters (default: 50)
 * @returns Geographic boundary encompassing all spots
 */
const calculateSpotBoundingBox = (spots: { location: GeoLocation }[], paddingMeters: number = 50): GeoBoundary => {
  if (!spots || spots.length === 0) {
    return {
      northEast: { lat: 0, lon: 0 },
      southWest: { lat: 0, lon: 0 },
    }
  }

  // Validate input coordinates
  const validSpots = spots.filter(s => {
    const { lat, lon } = s.location
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
  })

  if (validSpots.length === 0) {
    throw new Error('calculateSpotBoundingBox: No valid coordinates found')
  }

  if (validSpots.length === 1) {
    return calculateBoundaries(validSpots[0].location, paddingMeters)
  }

  // Find min/max latitude (straightforward)
  let minLat = Infinity
  let maxLat = -Infinity

  validSpots.forEach(spot => {
    minLat = Math.min(minLat, spot.location.lat)
    maxLat = Math.max(maxLat, spot.location.lat)
  })

  // Antimeridian handling: find minimal longitudinal span
  const lons = validSpots.map(s => s.location.lon).sort((a, b) => a - b)

  // Calculate gaps between consecutive longitudes
  let maxGap = 0

  for (let i = 0; i < lons.length - 1; i++) {
    const gap = lons[i + 1] - lons[i]
    if (gap > maxGap) {
      maxGap = gap
    }
  }

  // Check wrap-around gap
  const wrapGap = 360 - (lons[lons.length - 1] - lons[0])
  const useWrap = wrapGap < maxGap

  let minLon: number
  let maxLon: number

  if (useWrap) {
    // Points span across antimeridian - use wrap
    minLon = lons[lons.length - 1]
    maxLon = lons[0] + 360
  } else {
    // Normal case
    minLon = lons[0]
    maxLon = lons[lons.length - 1]
  }

  // Apply padding
  const latPadding = (paddingMeters / 1000) / 111 // degrees
  const avgLat = (minLat + maxLat) / 2
  const lonPadding = (paddingMeters / 1000) / (111 * Math.cos(avgLat * (Math.PI / 180))) // degrees

  minLat -= latPadding
  maxLat += latPadding
  minLon -= lonPadding
  maxLon += lonPadding

  // Normalize longitude to -180/+180 range
  const normalizeLon = (lon: number): number => {
    // Fast modulo-based normalization
    const normalized = ((lon + 180) % 360) - 180
    return normalized === -180 ? 180 : normalized
  }

  return {
    northEast: { lat: maxLat, lon: normalizeLon(maxLon) },
    southWest: { lat: minLat, lon: normalizeLon(minLon) },
  }
}

/**
 * Calculate target coordinates from origin, distance, and bearing
 * @param origin Starting coordinate
 * @param distance Distance in meters
 * @param bearing Bearing in degrees (0-360)
 * @returns Target coordinate
 */
const calculateTargetLocation = (origin: GeoLocation, distance: number, bearing: number): GeoLocation => {
  const bearingRad = toRadians(bearing)
  const distanceRatio = distance / EARTH_RADIUS

  const lat1Rad = toRadians(origin.lat)
  const lon1Rad = toRadians(origin.lon)

  const lat2Rad = Math.asin(Math.sin(lat1Rad) * Math.cos(distanceRatio) + Math.cos(lat1Rad) * Math.sin(distanceRatio) * Math.cos(bearingRad))

  const lon2Rad = lon1Rad + Math.atan2(Math.sin(bearingRad) * Math.sin(distanceRatio) * Math.cos(lat1Rad), Math.cos(distanceRatio) - Math.sin(lat1Rad) * Math.sin(lat2Rad))

  return {
    lat: toDegrees(lat2Rad),
    lon: toDegrees(lon2Rad),
  }
}

/**
 * Calculate the closest point on a boundary (GeoBoundary) to a given point
 * and the distance to that closest point
 * @param point The point to check
 * @param boundary The rectangular boundary
 * @returns Object with closest point on boundary and distance in meters
 */
const calculateDistanceToBoundary = (point: GeoLocation, boundary: GeoBoundary): { closestPoint: GeoLocation; distance: number } => {
  const { lat, lon } = point
  const { northEast, southWest } = boundary

  // If point is inside the boundary, distance is 0
  if (isCoordinateInBounds(point, boundary)) {
    return { closestPoint: point, distance: 0 }
  }

  // Clamp the point coordinates to the boundary to find the closest point
  const clampedLat = Math.max(southWest.lat, Math.min(northEast.lat, lat))
  const clampedLon = Math.max(southWest.lon, Math.min(northEast.lon, lon))

  const closestPoint: GeoLocation = {
    lat: clampedLat,
    lon: clampedLon,
  }

  const distance = calculateDistance(point, closestPoint)
  return { closestPoint, distance }
}

export const geoUtils = {
  compareCoordinates,
  calculateDistance,
  isCoordinateInBounds,
  toRadians,
  toDegrees,
  calculateBearing,
  bearingToDirection,
  calculateBoundaries,
  calculateSpotBoundingBox,
  findNearestCoordinate,
  calculateTargetLocation,
  calculateDistanceToBoundary,
}
