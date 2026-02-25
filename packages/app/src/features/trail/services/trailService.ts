import { Trail } from '@shared/contracts'
import { GeoLocation } from '@shared/geo'

/**
 * Calculates the geographic center of a trail from its boundary.
 */
export const getTrailCenter = (trail: Trail): GeoLocation => ({
  lat: (trail.boundary.northEast.lat + trail.boundary.southWest.lat) / 2,
  lon: (trail.boundary.northEast.lon + trail.boundary.southWest.lon) / 2,
})
