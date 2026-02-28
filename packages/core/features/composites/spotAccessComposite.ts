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
  SpotPreview,
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

        // Admin in creator context sees all spots; app context follows normal discovery rules
        if (context.role === 'admin' && context.client === 'creator') {
          return spotApplication.getSpots(context, options)
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
        // Strip trailId from filters — spots have no trailId field; trailId was only needed above
        const { trailId: _trailId, ...spotFilters } = (options?.filters ?? {}) as Record<string, unknown>
        const spotQueryOptions = options ? { ...options, filters: spotFilters } : undefined
        const spotsResult = await spotApplication.getSpotsByIds(context, spotIds, spotQueryOptions)
        if (!spotsResult.success) {
          return createErrorResult('GET_SPOTS_ERROR', { reason: 'Failed to fetch spots' })
        }

        return createSuccessResult(spotsResult.data || [])
      } catch (error: any) {
        return createErrorResult('GET_SPOTS_ERROR', { originalError: error.message })
      }
    },

    async getAccessibleSpot(context: AccountContext, spotId: string): Promise<Result<Spot | SpotPreview | undefined>> {
      try {
        const accountId = context.accountId
        if (!accountId) {
          return createErrorResult('ACCOUNT_ID_REQUIRED')
        }

        // Fetch spot to check ownership
        const spotResult = await spotApplication.getSpot(context, spotId)
        if (!spotResult.success) {
          return spotResult
        }

        const spot = spotResult.data
        if (!spot) {
          return createSuccessResult(undefined)
        }

        // Admin in creator context has full access; app context follows normal discovery rules
        if (context.role === 'admin' && context.client === 'creator') {
          return createSuccessResult({ ...spot, source: 'created' as const })
        }

        // Creators always have access to their own spots
        if (spot.createdBy === accountId) {
          return createSuccessResult({ ...spot, source: 'created' })
        }

        // All others must have discovered the spot
        const discoveredIdsResult = await discoveryApplication.getDiscoveredSpotIds(context)
        if (!discoveredIdsResult.success || !discoveredIdsResult.data) {
          return createErrorResult('GET_SPOTS_ERROR', { reason: 'Failed to resolve discovered spot IDs' })
        }

        if (discoveredIdsResult.data.includes(spotId)) {
          return createSuccessResult({ ...spot, source: 'discovery' })
        }

        // Not discovered — return preview data only (no name, location, or description)
        const previewResult = await spotApplication.getSpotPreviewsByIds(context, [spotId])
        if (!previewResult.success || !previewResult.data?.length) {
          return createSuccessResult(undefined)
        }

        return createSuccessResult(previewResult.data[0])
      } catch (error: any) {
        return createErrorResult('GET_SPOTS_ERROR', { originalError: error.message })
      }
    },
  }
}
