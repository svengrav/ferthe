import { spotStore } from '@app/features/spot/stores/spotStore'
import { ImageReference, SpotSource } from '@shared/contracts'
import { GeoLocation } from '@shared/geo'
import { useMemo } from 'react'
import { useDiscoverySpotIds } from '../../discovery/stores/discoveryTrailStore'

/**
 * Minimal spot data for map marker rendering
 */
export interface MapSpot {
  id: string
  location: GeoLocation
  name: string
  image?: ImageReference
  source?: SpotSource
}

/**
 * ViewModel for map spots - provides minimal data needed for marker rendering.
 * Card components fetch additional details via spotId from their own stores.
 */
export function useMapSpotsViewModel(): MapSpot[] {
  const spotIds = useDiscoverySpotIds()
  const spotsById = spotStore(state => state.byId)

  const mapSpots = useMemo(() => {
    return spotIds
      .map(spotId => {
        const spot = spotsById[spotId]
        if (!spot) return undefined

        const mapSpot: MapSpot = {
          id: spot.id,
          location: spot.location,
          name: spot.name,
          image: spot.image,
          source: spot.source,
        }

        return mapSpot
      })
      .filter(Boolean) as MapSpot[]
  }, [spotIds, spotsById])

  return mapSpots
}
