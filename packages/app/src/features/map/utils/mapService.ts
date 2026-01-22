import { Discovery, Spot } from '@shared/contracts'
import { GeoBoundary, GeoLocation, GeoRegion, geoUtils } from '@shared/geo'
import { Direction, DIRECTIONS, MapCompass } from '../types/compass'
import { DeviceBoundaryStatus, MAP_SPECIFICATION_DEFAULTS } from '../types/map'

export const mapService = {
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

  calculateMapRegion: (trailRegion: GeoRegion | undefined, deviceLocation: GeoLocation | undefined): { region: GeoRegion; boundary: GeoBoundary } => {
    const region =
      trailRegion ??
      ({
        center: deviceLocation ?? { lat: 0, lon: 0 },
        radius: MAP_SPECIFICATION_DEFAULTS.MAP_RADIUS,
      } as GeoRegion)

    const boundary = geoUtils.calculateBoundaries(region.center, region.radius + MAP_SPECIFICATION_DEFAULTS.MAP_DEFAULT_PADDING)

    return { region, boundary }
  },

  calculateMapSnap: (spots: Spot[], discoveries: Discovery[], deviceLocation: GeoLocation | undefined, snapIntensity?: number) => {
    if (!deviceLocation || !snapIntensity || snapIntensity === 0) {
      return {
        startPoint: deviceLocation ?? { lat: 0, lon: 0 },
        endPoint: deviceLocation ?? { lat: 0, lon: 0 },
        intensity: 0,
      }
    }

    // Find the most recent discovery to use as start point
    const lastDiscovery = discoveries.length > 0
      ? [...discoveries].sort((a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime())[0]
      : undefined

    const lastDiscoveredSpot = lastDiscovery
      ? spots.find(spot => spot.id === lastDiscovery.spotId)
      : undefined

    // Find unexplored spots to determine end point
    const exploredSpotIds = discoveries.map(d => d.spotId)
    const unexploredSpots = spots.filter(spot => !exploredSpotIds.includes(spot.id))

    // Find nearest unexplored spot as end point
    let nearestUnexploredSpot: Spot | undefined
    if (unexploredSpots.length > 0) {
      nearestUnexploredSpot = unexploredSpots.reduce((closest, spot) => {
        const distanceToCurrent = geoUtils.calculateDistance(deviceLocation, closest.location)
        const distanceToSpot = geoUtils.calculateDistance(deviceLocation, spot.location)
        return distanceToSpot < distanceToCurrent ? spot : closest
      })
    }

    return {
      startPoint: lastDiscoveredSpot?.location ?? deviceLocation,
      endPoint: nearestUnexploredSpot?.location ?? deviceLocation,
      intensity: snapIntensity,
    }
  },
}

export const getMapService = () => mapService
