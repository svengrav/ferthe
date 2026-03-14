import { useMemo } from 'react'

import { useSpotsById, useSpotPreviewsById } from '@app/features/spot/stores/spotStore'
import { useTrailSpotIds } from '@app/features/trail/stores/trailStore'
import { Spot, SpotPreview } from '@shared/contracts'
import { TrailSpotViewModel } from '../types/viewModels'

export function buildTrailSpotsViewModel(
  trailSpotIds: string[],
  spotsById: Record<string, Spot>,
  previewsById: Record<string, SpotPreview>,
): TrailSpotViewModel[] {
  return trailSpotIds.map((spotId, index) => {
    const spot = spotsById[spotId]
    const preview = previewsById[spotId]

    if (spot) {
      return {
        id: spot.id,
        order: index,
        discovered: true,
        title: spot.name,
        image: spot.image,
        blurredImage: undefined,
      }
    }

    return {
      id: preview?.id ?? spotId,
      order: index,
      discovered: false,
      title: undefined,
      image: undefined,
      blurredImage: preview?.blurredImage,
    }
  })
}

export function useTrailSpotsViewModel(trailId: string): TrailSpotViewModel[] {
  const trailSpotIds = useTrailSpotIds(trailId)
  const spotsById = useSpotsById()
  const previewsById = useSpotPreviewsById()

  return useMemo(
    () => buildTrailSpotsViewModel(trailSpotIds, spotsById, previewsById),
    [trailSpotIds, spotsById, previewsById],
  )
}
