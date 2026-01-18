import { geoUtils } from '@shared/geo'
import { DeviceLocation } from './types'

/**
 * Determines if there's a significant change between two device locations
 * @param prevUpdate Previous device location update
 * @param currentUpdate Current device location update
 * @param minHeadingDegrees Minimum heading change to consider significant (in degrees)
 * @param minDistanceMeters Minimum distance change to consider significant (in meters)
 * @returns true if the change exceeds minimum thresholds
 */
export const hasSignificantLocationChange = (prevUpdate: DeviceLocation, currentUpdate: DeviceLocation, minHeadingDegrees = 15, minDistanceMeters = 10): boolean => {
  // Warn if we get 0,0 coordinates (likely an error)
  if (currentUpdate.location.lat === 0 && currentUpdate.location.lon === 0) {
    console.warn('Received 0,0 coordinates - potential GPS issue')
    return false // Don't emit invalid coordinates
  }

  // Check heading change
  const headingDiff = Math.abs(currentUpdate.heading - prevUpdate.heading)
  const hasSignificantHeadingChange = headingDiff >= minHeadingDegrees

  // Check location change using existing geoUtils function
  const distanceInMeters = geoUtils.calculateDistance(prevUpdate.location, currentUpdate.location)
  const hasSignificantLocationChange = distanceInMeters >= minDistanceMeters

  return hasSignificantHeadingChange || hasSignificantLocationChange
}
