import { Store } from '@core/store/storeFactory.ts'
import { AccountContext, Discovery, Result, Spot, SpotApplicationContract, SpotPreview, StoredSpot } from '@shared/contracts/index.ts'
import { createSpotService, SpotServiceActions } from './spotService.ts'

export interface SpotApplicationActions extends SpotApplicationContract { }

export interface SpotApplicationConfig {
  spotStore: Store<StoredSpot>
  discoveryStore: Store<Discovery>
  spotService?: SpotServiceActions
}

export function createSpotApplication(config: SpotApplicationConfig): SpotApplicationActions {
  const { spotStore, discoveryStore, spotService = createSpotService() } = config

  return {
    async getSpots(context?: AccountContext): Promise<Result<Spot[]>> {
      try {
        const spotsResult = await spotStore.list()
        if (!spotsResult.success) {
          return { success: false, error: { message: 'Failed to list spots', code: 'GET_SPOTS_ERROR' } }
        }

        let spots = spotsResult.data || []

        // Enrich with userStatus if context is provided
        if (context?.accountId) {
          const discoveriesResult = await discoveryStore.list()
          if (discoveriesResult.success && discoveriesResult.data) {
            spots = spotService.enrichSpotsWithUserStatus(spots, context.accountId, discoveriesResult.data)
          }
        }

        // Filter spots based on user status
        const filteredSpots = spots
          .map(spot => spotService.filterSpotByUserStatus(spot))
          .filter((spot): spot is Spot => spot !== undefined)

        return { success: true, data: filteredSpots }
      } catch (error: any) {
        return { success: false, error: { message: error.message, code: 'GET_SPOTS_ERROR' } }
      }
    },

    async getSpot(context: AccountContext, id: string): Promise<Result<Spot | undefined>> {
      try {
        const spotsResult = await spotStore.list()
        if (!spotsResult.success) {
          return { success: false, error: { message: 'Failed to list spots', code: 'GET_SPOT_ERROR' } }
        }
        const spots = spotsResult.data || []
        let spot = spots.find(s => s.id === id)

        if (!spot) {
          return { success: true, data: undefined }
        }

        // Enrich with userStatus if context is provided
        if (context?.accountId) {
          const discoveriesResult = await discoveryStore.list()
          if (discoveriesResult.success && discoveriesResult.data) {
            spot = spotService.enrichSpotWithUserStatus(spot, context.accountId, discoveriesResult.data)
          }
        }

        // Filter spot data based on user status
        const filteredSpot = spotService.filterSpotByUserStatus(spot)

        return { success: true, data: filteredSpot }
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
