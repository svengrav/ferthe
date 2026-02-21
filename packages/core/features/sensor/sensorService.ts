import { createCuid2 } from '@core/utils/idGenerator'
import { Clue, ClueSource, Discovery, ScanEvent, Spot } from '@shared/contracts'
import { GeoLocation } from '@shared/geo'
import { geoUtils } from '@shared/geo/geoUtils'

export type SensorServiceType = {
  generateScanEvent: (accountId: string, location: GeoLocation, spots: Spot[], radiusUsed: number, discoveries: Discovery[], trailId?: string) => ScanEvent
}

export const createSensorService = (): SensorServiceType => ({
  generateScanEvent: (accountId: string, location: GeoLocation, spots: Spot[], radiusUsed: number, discoveries: Discovery[], trailId?: string): ScanEvent => {
    const discoveredSpotIds = discoveries
      .filter(d => d.accountId === accountId)
      .map(d => d.spotId)

    const spotsInRange = spots.filter(spot => {
      const distance = geoUtils.calculateDistance(location, spot.location)
      return distance <= radiusUsed && spot.createdBy !== accountId
    })

    const clues: Clue[] = spots
      .filter(spot => {
        const distance = geoUtils.calculateDistance(location, spot.location)
        return distance <= radiusUsed && distance > spot.options.discoveryRadius && !discoveredSpotIds.includes(spot.id) && spot.createdBy !== accountId
      })
      .map(spot => ({
        id: createCuid2(),
        spotId: spot.id,
        trailId: trailId,
        location: spot.location,
        source: 'scanEvent' as ClueSource,
        discoveryRadius: spot.options.discoveryRadius,
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
