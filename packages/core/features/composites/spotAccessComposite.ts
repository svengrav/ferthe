import {
  AccountContext,
  createErrorResult,
  createSuccessResult,
  DiscoveryApplicationContract,
  QueryOptions,
  Result,
  Spot,
  SpotAccessCompositeContract,
  SpotApplicationContract,
} from '@shared/contracts/index.ts'

export interface SpotAccessCompositeOptions {
  discoveryApplication: DiscoveryApplicationContract
  spotApplication: SpotApplicationContract
}

/**
 * Resolves the circular dependency between spot and discovery domains.
 * Provides access-controlled spot queries by filtering through discovery data.
 */
export function createSpotAccessComposite(options: SpotAccessCompositeOptions): SpotAccessCompositeContract {
  const { discoveryApplication, spotApplication } = options

  return {
    async getAccessibleSpots(context: AccountContext, trailId?: string, options?: QueryOptions): Promise<Result<Spot[]>> {
      try {
        const accountId = context.accountId
        if (!accountId) {
          return createErrorResult('ACCOUNT_ID_REQUIRED')
        }

        // Step 1: Get discovered spot IDs (access control via discovery domain)
        const discoveredIdsResult = await discoveryApplication.getDiscoveredSpotIds(context, trailId)
        if (!discoveredIdsResult.success || !discoveredIdsResult.data) {
          return createErrorResult('GET_SPOTS_ERROR', { reason: 'Failed to resolve discovered spot IDs' })
        }

        const spotIds = discoveredIdsResult.data
        if (spotIds.length === 0) {
          return createSuccessResult([])
        }

        // Step 2: Fetch full spot data (data access via spot domain)
        const spotsResult = await spotApplication.getSpotsByIds(context, spotIds, options)
        if (!spotsResult.success) {
          return createErrorResult('GET_SPOTS_ERROR', { reason: 'Failed to fetch spots' })
        }

        return createSuccessResult(spotsResult.data || [])
      } catch (error: any) {
        return createErrorResult('GET_SPOTS_ERROR', { originalError: error.message })
      }
    },
  }
}
