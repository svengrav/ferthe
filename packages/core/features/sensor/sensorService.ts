import { createCuid2 } from '@core/utils/idGenerator'
import { Clue, ClueSource, ScanEvent, Spot } from '@shared/contracts'
import { GeoLocation } from '@shared/geo'
import { geoUtils } from '@shared/geo/geoUtils'

export type SensorServiceType = {
  generateScanEvent: (accountId: string, location: GeoLocation, spots: Spot[], radiusUsed: number, trailId?: string) => ScanEvent
}

export const createSensorService = (): SensorServiceType => ({
  generateScanEvent: (accountId: string, location: GeoLocation, spots: Spot[], radiusUsed: number, trailId?: string): ScanEvent => {
    const spotsInRange = spots.filter(spot => {
      const distance = geoUtils.calculateDistance(location, spot.location)
      return distance <= radiusUsed
    })

    const clues: Clue[] = spots
      .filter(spot => {
        const distance = geoUtils.calculateDistance(location, spot.location)
        return distance <= radiusUsed && distance > spot.options.discoveryRadius
      })
      .map(spot => ({
        id: createCuid2(),
        spotId: spot.id,
        trailId: spot.trailId,
        location: spot.location,
        source: 'scanEvent' as ClueSource,
      }))

    const successful = spotsInRange.length > 0

    return {
      id: createCuid2(),
      accountId: accountId,
      scannedAt: new Date(),
      radiusUsed,
      successful,
      trailId: trailId,
      clues,
      location: location,
      createdAt: new Date(),
    }
  },
})
