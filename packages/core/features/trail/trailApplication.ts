import { Store } from '@core/store/storeFactory.ts'
import { createCuid2 } from '@core/utils/idGenerator.ts'
import { createSlug } from '@core/utils/slug.ts'
import { AccountContext, Result, Spot, SpotPreview, Trail, TrailApplicationContract } from '@shared/contracts/index.ts'

interface TrailApplicationOptions {
  trailStore: Store<Trail>
  spotStore: Store<Spot>
}

export function createTrailApplication({ trailStore, spotStore }: TrailApplicationOptions): TrailApplicationContract {
  return {
    listSpotPreviews: async (context: AccountContext, trailId?: string): Promise<Result<SpotPreview[]>> => {
      try {
        const spotsResult = await spotStore.list()
        if (!spotsResult.success) {
          return { success: false, error: { message: 'Failed to list spots', code: 'GET_SPOT_PREVIEWS_ERROR' } }
        }
        const spots = spotsResult.data || []
        const filteredSpots = spots.filter(spot => !trailId || spot.trailId === trailId)
        return { success: true, data: filteredSpots }
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'GET_SPOT_PREVIEWS_ERROR' } }
      }
    },

    getSpot: async (context: AccountContext, spotId: string): Promise<Result<Spot | undefined>> => {
      try {
        const spotResult = await spotStore.get(spotId)
        if (!spotResult.success) {
          return { success: false, error: { message: 'Failed to get spot', code: 'GET_SPOT_ERROR' } }
        }
        return { success: true, data: spotResult.data }
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'GET_SPOT_ERROR' } }
      }
    },

    getTrail: async (context: AccountContext, trailId: string): Promise<Result<Trail | undefined>> => {
      try {
        const trailResult = await trailStore.get(trailId)
        if (!trailResult.success) {
          return { success: false, error: { message: 'Failed to get trail', code: 'GET_TRAIL_ERROR' } }
        }
        return { success: true, data: trailResult.data }
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'GET_TRAIL_ERROR' } }
      }
    },

    listTrails: async (context: AccountContext): Promise<Result<Trail[]>> => {
      try {
        const trailsResult = await trailStore.list()
        if (!trailsResult.success) {
          return { success: false, error: { message: 'Failed to list trails', code: 'LIST_TRAILS_ERROR' } }
        }
        return { success: true, data: trailsResult.data || [] }
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'LIST_TRAILS_ERROR' } }
      }
    },

    listSpots: async (context: AccountContext, trailId?: string): Promise<Result<Spot[]>> => {
      try {
        const spotsResult = await spotStore.list()
        if (!spotsResult.success) {
          return { success: false, error: { message: 'Failed to list spots', code: 'LIST_SPOTS_ERROR' } }
        }
        const spots = spotsResult.data || []
        const filteredSpots = spots.filter(spot => !trailId || spot.trailId === trailId)
        return { success: true, data: filteredSpots }
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'LIST_SPOTS_ERROR' } }
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
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'CREATE_TRAIL_ERROR' } }
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
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'CREATE_SPOT_ERROR' } }
      }
    },
  }
}
