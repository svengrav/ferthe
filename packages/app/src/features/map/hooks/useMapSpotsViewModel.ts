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
    // Include discovery trail spots + all locally created spots (not yet in trail)
    const createdSpotIds = Object.values(spotsById)
      .filter(s => s.source === 'created')
      .map(s => s.id)
    const allSpotIds = Array.from(new Set([...spotIds, ...createdSpotIds]))

    return allSpotIds
      .map(spotId => {
        const spot = spotsById[spotId]
        if (!spot) return undefined

        return {
          id: spot.id,
          location: spot.location,
          name: spot.name,
          image: spot.image,
          source: spot.source,
        } satisfies MapSpot
      })
      .filter(Boolean) as MapSpot[]
  }, [spotIds, spotsById])

  return mapSpots
}
