import { spotStore } from '@app/features/spot/stores/spotStore'
import { DiscoverySpot } from '@shared/contracts'
import { useMemo } from 'react'
import { discoveryStore } from '../stores/discoveryStore'
import { useDiscoverySpotIds } from '../stores/discoveryTrailStore'

/**
 * ViewModel hook that merges normalized data from spotStore and discoveryStore
 * to create DiscoverySpot objects.
 * 
 * DiscoverySpot = Spot + Discovery metadata (discoveryId, discoveredAt)
 * 
 * Returns all spots from active trail:
 * - Discovered spots (have discovery record)
 * - Created spots (user-created, have discovery)
 * - Public spots (no discovery, use spot.createdAt)
 */
export function useDiscoverySpotsViewModel(): DiscoverySpot[] {
  const spotIds = useDiscoverySpotIds()
  const spotsById = spotStore(state => state.byId)
  const discoveriesById = discoveryStore(state => state.byId)

  // Create array of DiscoverySpots by merging spot + discovery data
  const discoverySpots = useMemo(() => {
    return spotIds
      .map(spotId => {
        const spot = spotsById[spotId]
        if (!spot) return undefined

        // Find discovery for this spot
        const discovery = Object.values(discoveriesById).find(d => d.spotId === spotId)

        const discoverySpot: DiscoverySpot = {
          ...spot,
          discoveryId: discovery?.id || '',
          discoveredAt: discovery?.discoveredAt, // undefined if not discovered
        }

        return discoverySpot
      })
      .filter(Boolean) as DiscoverySpot[]
  }, [spotIds, spotsById, discoveriesById])

  return discoverySpots
}

