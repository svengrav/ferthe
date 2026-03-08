import { Trail } from '@shared/contracts'
import { GeoLocation } from '@shared/geo'

/**
 * Calculates the geographic center of a trail from its boundary.
 * Returns undefined for trails without a fixed boundary (e.g. stumble trails).
 */
export const getTrailCenter = (trail: Trail | undefined): GeoLocation | undefined => {
  if (!trail?.boundary) return undefined
  return {
    lat: (trail.boundary.northEast.lat + trail.boundary.southWest.lat) / 2,
    lon: (trail.boundary.northEast.lon + trail.boundary.southWest.lon) / 2,
  }
}
