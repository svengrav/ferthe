import { useMemo } from 'react'

import { getSpotsById, useSpotPreviewsById } from '@app/features/spot/stores/spotStore'
import { useTrailSpotIds } from '@app/features/trail/stores/trailStore'
import { TrailSpotRowVM } from '../types/viewModels'

/**
 * Facade hook that composes trail spot data for UI display.
 * Merges spot previews, discovered spots, and trail order into a unified view model.
 * 
 * This is the orchestration layer that prevents components from accessing multiple stores.
 * 
 * @param trailId - ID of the trail to load spots for
 * @returns Array of TrailSpotRowVM sorted by trail order
 */
export function useTrailSpotsViewModel(trailId: string): TrailSpotRowVM[] {
  const trailSpotIds = useTrailSpotIds(trailId)
  const spotsById = getSpotsById()
  const previewsById = useSpotPreviewsById()

  return useMemo(() => {
    const viewModels: TrailSpotRowVM[] = []

    trailSpotIds.forEach((spotId, index) => {
      const spot = spotsById[spotId]
      const preview = previewsById[spotId]

      if (spot) {
        // Discovered spot - full data available
        viewModels.push({
          id: spot.id,
          order: index,
          discovered: true,
          title: spot.name,
          image: spot.image,
          blurredImage: undefined,
        })
      } else if (preview) {
        // Undiscovered spot - only preview available
        viewModels.push({
          id: preview.id,
          order: index,
          discovered: false,
          title: undefined,
          image: undefined,
          blurredImage: preview.blurredImage,
        })
      }
      // If neither spot nor preview exists, skip (shouldn't happen in practice)
    })

    return viewModels
  }, [trailSpotIds, spotsById, previewsById])
}
