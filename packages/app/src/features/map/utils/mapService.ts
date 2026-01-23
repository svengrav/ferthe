import { Spot } from '@shared/contracts'
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

  calculateMapSnap: (spots: Spot[], deviceLocation: GeoLocation | undefined, snapIntensity?: number, lastDiscoverySpotLocation?: GeoLocation) => {
    return {
      startPoint: lastDiscoverySpotLocation ?? spots.at(-1)?.location ?? deviceLocation ?? { lat: 0, lon: 0 },
      endPoint: deviceLocation ?? { lat: 0, lon: 0 },
      intensity: snapIntensity ?? 0,
    }
  },
}

export const getMapService = () => mapService
