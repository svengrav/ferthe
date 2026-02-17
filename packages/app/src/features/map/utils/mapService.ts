import { Spot } from '@shared/contracts'
import { GeoLocation } from '@shared/geo'
import { Direction, DIRECTIONS, MapCompass } from '../types/compass'

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

  calculateMapSnap: (spots: Spot[], deviceLocation: GeoLocation | undefined, snapIntensity?: number, lastDiscoverySpotLocation?: GeoLocation) => {
    return {
      startPoint: lastDiscoverySpotLocation ?? spots.at(-1)?.location ?? deviceLocation ?? { lat: 0, lon: 0 },
      endPoint: deviceLocation ?? { lat: 0, lon: 0 },
      intensity: snapIntensity ?? 0,
    }
  },
}

export const getMapService = () => mapService
