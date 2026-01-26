import { Store } from '@core/store/storeFactory.ts'
import { createCuid2 } from '@core/utils/idGenerator.ts'
import { createSlug } from '@core/utils/slug.ts'
import { AccountContext, Result, Spot, SpotPreview, Trail, TrailApplicationContract, TrailSpot } from '@shared/contracts/index.ts'
import { geoUtils } from '@shared/geo/index.ts'

interface TrailApplicationOptions {
  trailStore: Store<Trail>
  spotStore: Store<Spot>
  trailSpotStore: Store<TrailSpot>
}

/**
 * Helper: Enrich trail with calculated boundary from spots
 * @param trail Trail to enrich
 * @param trailSpotStore Store for trail-spot relationships
 * @param spotStore Store for spots
 * @returns Trail with boundary calculated from its spots
 */
async function enrichTrailWithBoundary(
  trail: Trail,
  trailSpotStore: Store<TrailSpot>,
  spotStore: Store<Spot>
): Promise<Trail> {
  // If boundary already exists, return as-is
  if (trail.boundary) {
    return trail
  }

  // Get spots for this trail
  const trailSpotsResult = await trailSpotStore.list()
  if (!trailSpotsResult.success) {
    return trail // Return original if can't fetch trail-spots
  }

  const spotIds = (trailSpotsResult.data || [])
    .filter(ts => ts.trailId === trail.id)
    .map(ts => ts.spotId)

  if (spotIds.length === 0) {
    return trail // No spots, return original
  }

  // Fetch actual spots
  const spotsResult = await spotStore.list()
  if (!spotsResult.success) {
    return trail
  }

  const spots = (spotsResult.data || []).filter(spot => spotIds.includes(spot.id))

  if (spots.length === 0) {
    return trail
  }

  // Calculate boundary
  const boundary = geoUtils.calculateSpotBoundingBox(spots, 500)

  return {
    ...trail,
    boundary
  }
}

export function createTrailApplication({ trailStore, spotStore, trailSpotStore }: TrailApplicationOptions): TrailApplicationContract {
  return {
    listSpotPreviews: async (context: AccountContext, trailId?: string): Promise<Result<SpotPreview[]>> => {
      try {
        if (!trailId) {
          const spotsResult = await spotStore.list()
          if (!spotsResult.success) {
            return { success: false, error: { message: 'Failed to list spots', code: 'GET_SPOT_PREVIEWS_ERROR' } }
          }
          return { success: true, data: spotsResult.data || [] }
        }

        // Get trail-spot relationships
        const trailSpotsResult = await trailSpotStore.list()
        if (!trailSpotsResult.success) {
          return { success: false, error: { message: 'Failed to list trail spots', code: 'GET_SPOT_PREVIEWS_ERROR' } }
        }

        const trailSpots = (trailSpotsResult.data || []).filter(ts => ts.trailId === trailId)
        const spotIds = trailSpots.map(ts => ts.spotId)

        // Get spots
        const spotsResult = await spotStore.list()
        if (!spotsResult.success) {
          return { success: false, error: { message: 'Failed to list spots', code: 'GET_SPOT_PREVIEWS_ERROR' } }
        }

        const spots = (spotsResult.data || []).filter(spot => spotIds.includes(spot.id))
        return { success: true, data: spots }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'GET_SPOT_PREVIEWS_ERROR' } }
      }
    },

    getSpot: async (context: AccountContext, spotId: string): Promise<Result<Spot | undefined>> => {
      try {
        const spotResult = await spotStore.get(spotId)
        if (!spotResult.success) {
          return { success: false, error: { message: 'Failed to get spot', code: 'GET_SPOT_ERROR' } }
        }
        return { success: true, data: spotResult.data }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'GET_SPOT_ERROR' } }
      }
    },

    getTrail: async (context: AccountContext, trailId: string): Promise<Result<Trail | undefined>> => {
      try {
        const trailResult = await trailStore.get(trailId)
        if (!trailResult.success) {
          return { success: false, error: { message: 'Failed to get trail', code: 'GET_TRAIL_ERROR' } }
        }

        if (!trailResult.data) {
          return { success: true, data: undefined }
        }

        // Enrich trail with calculated boundary
        const enrichedTrail = await enrichTrailWithBoundary(trailResult.data, trailSpotStore, spotStore)

        return { success: true, data: enrichedTrail }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'GET_TRAIL_ERROR' } }
      }
    },

    getTrailSpotIds: async (context: AccountContext, trailId: string): Promise<Result<string[]>> => {
      try {
        const trailSpotsResult = await trailSpotStore.list()
        if (!trailSpotsResult.success) {
          return { success: false, error: { message: 'Failed to list trail spots', code: 'GET_TRAIL_SPOT_IDS_ERROR' } }
        }

        const trailSpots = (trailSpotsResult.data || [])
          .filter(ts => ts.trailId === trailId)
          .sort((a, b) => {
            // Sort by order if available, otherwise by createdAt
            if (a.order !== undefined && b.order !== undefined) {
              return a.order - b.order
            }
            if (a.order !== undefined) return -1
            if (b.order !== undefined) return 1
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          })

        return { success: true, data: trailSpots.map(ts => ts.spotId) }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'GET_TRAIL_SPOT_IDS_ERROR' } }
      }
    },

    listTrails: async (context: AccountContext): Promise<Result<Trail[]>> => {
      try {
        const trailsResult = await trailStore.list()
        if (!trailsResult.success) {
          return { success: false, error: { message: 'Failed to list trails', code: 'LIST_TRAILS_ERROR' } }
        }

        const trails = trailsResult.data || []

        // Enrich each trail with calculated boundary
        const enrichedTrails = await Promise.all(
          trails.map(trail => enrichTrailWithBoundary(trail, trailSpotStore, spotStore))
        )

        return { success: true, data: enrichedTrails }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'LIST_TRAILS_ERROR' } }
      }
    },

    listSpots: async (context: AccountContext, trailId?: string): Promise<Result<Spot[]>> => {
      try {
        if (!trailId) {
          const spotsResult = await spotStore.list()
          if (!spotsResult.success) {
            return { success: false, error: { message: 'Failed to list spots', code: 'LIST_SPOTS_ERROR' } }
          }
          return { success: true, data: spotsResult.data || [] }
        }

        // Get trail-spot relationships
        const trailSpotsResult = await trailSpotStore.list()
        if (!trailSpotsResult.success) {
          return { success: false, error: { message: 'Failed to list trail spots', code: 'LIST_SPOTS_ERROR' } }
        }

        const trailSpots = (trailSpotsResult.data || []).filter(ts => ts.trailId === trailId)
        const spotIds = trailSpots.map(ts => ts.spotId)

        // Get spots
        const spotsResult = await spotStore.list()
        if (!spotsResult.success) {
          return { success: false, error: { message: 'Failed to list spots', code: 'LIST_SPOTS_ERROR' } }
        }

        const spots = (spotsResult.data || []).filter(spot => spotIds.includes(spot.id))
        return { success: true, data: spots }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'LIST_SPOTS_ERROR' } }
      }
    },

    createTrail: async (context: AccountContext, trailData: Omit<Trail, 'id' | 'slug'>): Promise<Result<Trail>> => {
      try {
        const trail: Trail = { ...trailData, id: createCuid2(), slug: createSlug(trailData.name) }
        const createdTrailResult = await trailStore.create(trail)
        if (!createdTrailResult.success) {
          return { success: false, error: { message: 'Failed to create trail', code: 'CREATE_TRAIL_ERROR' } }
        }
        return { success: true, data: createdTrailResult.data! }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'CREATE_TRAIL_ERROR' } }
      }
    },

    createSpot: async (context: AccountContext, spotData: Omit<Spot, 'id' | 'slug'>): Promise<Result<Spot>> => {
      try {
        const spot: Spot = { ...spotData, id: createCuid2(), slug: createSlug(spotData.name) }
        const createdSpotResult = await spotStore.create(spot)
        if (!createdSpotResult.success) {
          return { success: false, error: { message: 'Failed to create spot', code: 'CREATE_SPOT_ERROR' } }
        }
        return { success: true, data: createdSpotResult.data! }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'CREATE_SPOT_ERROR' } }
      }
    },

    addSpotToTrail: async (context: AccountContext, trailId: string, spotId: string, order?: number): Promise<Result<TrailSpot>> => {
      try {
        // Check if relationship already exists
        const existingResult = await trailSpotStore.list()
        if (existingResult.success) {
          const existing = (existingResult.data || []).find(ts => ts.trailId === trailId && ts.spotId === spotId)
          if (existing) {
            return { success: false, error: { message: 'Spot already added to trail', code: 'SPOT_ALREADY_IN_TRAIL' } }
          }
        }

        const trailSpot: TrailSpot = {
          id: createCuid2(),
          trailId,
          spotId,
          order,
          createdAt: new Date(),
        }

        const result = await trailSpotStore.create(trailSpot)
        if (!result.success) {
          return { success: false, error: { message: 'Failed to add spot to trail', code: 'ADD_SPOT_TO_TRAIL_ERROR' } }
        }
        return { success: true, data: result.data! }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'ADD_SPOT_TO_TRAIL_ERROR' } }
      }
    },

    removeSpotFromTrail: async (context: AccountContext, trailId: string, spotId: string): Promise<Result<void>> => {
      try {
        const trailSpotsResult = await trailSpotStore.list()
        if (!trailSpotsResult.success) {
          return { success: false, error: { message: 'Failed to list trail spots', code: 'REMOVE_SPOT_FROM_TRAIL_ERROR' } }
        }

        const trailSpot = (trailSpotsResult.data || []).find(ts => ts.trailId === trailId && ts.spotId === spotId)
        if (!trailSpot) {
          return { success: false, error: { message: 'Spot not found in trail', code: 'SPOT_NOT_IN_TRAIL' } }
        }

        const deleteResult = await trailSpotStore.delete(trailSpot.id)
        if (!deleteResult.success) {
          return { success: false, error: { message: 'Failed to remove spot from trail', code: 'REMOVE_SPOT_FROM_TRAIL_ERROR' } }
        }

        return { success: true, data: undefined }
      } catch (error: unknown) {
        return { success: false, error: { message: error instanceof Error ? error.message : 'Unknown error', code: 'REMOVE_SPOT_FROM_TRAIL_ERROR' } }
      }
    },
  }
}
