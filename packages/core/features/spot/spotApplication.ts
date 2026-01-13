import { Store } from '@core/store/storeFactory.ts'
import { Result, Spot, SpotApplicationContract, SpotPreview } from '@shared/contracts/index.ts'
import console from 'console';

export interface SpotApplicationActions extends SpotApplicationContract {}

export interface SpotApplicationConfig {
  spotStore: Store<Spot>
}

export function createSpotApplication(config: SpotApplicationConfig): SpotApplicationActions {
  const { spotStore } = config

  return {
    async getSpots(): Promise<Result<Spot[]>> {
      try {
        // Dummy implementation
        console.log('SpotApplication: Getting all spots')
        const spotsResult = await spotStore.list()
        if (!spotsResult.success) {
          return { success: false, error: { message: 'Failed to list spots', code: 'GET_SPOTS_ERROR' } }
        }
        return { success: true, data: spotsResult.data || [] }
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'GET_SPOTS_ERROR' } }
      }
    },

    async getSpot(id: string): Promise<Result<Spot | undefined>> {
      try {
        // Dummy implementation
        console.log(`SpotApplication: Getting spot by id: ${id}`)
        const spotsResult = await spotStore.list()
        if (!spotsResult.success) {
          return { success: false, error: { message: 'Failed to list spots', code: 'GET_SPOT_ERROR' } }
        }
        const spots = spotsResult.data || []
        const spot = spots.find(s => s.id === id)
        return { success: true, data: spot }
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'GET_SPOT_ERROR' } }
      }
    },

    async createSpot(spotData: Omit<Spot, 'id'>): Promise<Result<Spot>> {
      try {
        // Dummy implementation
        console.log('SpotApplication: Creating spot:', spotData)
        const newSpot: Spot = { id: 'dummy-spot-id', ...spotData }
        const createResult = await spotStore.create(newSpot)
        if (!createResult.success) {
          return { success: false, error: { message: 'Failed to create spot', code: 'CREATE_SPOT_ERROR' } }
        }
        return { success: true, data: createResult.data! }
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'CREATE_SPOT_ERROR' } }
      }
    },
    getSpotPreviews: function (): Promise<Result<SpotPreview[]>> {
      throw new Error('Function not implemented.')
    },
  }
}
