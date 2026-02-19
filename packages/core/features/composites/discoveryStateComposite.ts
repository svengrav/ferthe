import {
  AccountContext,
  ActivateTrailResult,
  createErrorResult,
  createSuccessResult,
  DiscoveryApplicationContract,
  DiscoveryState,
  DiscoveryStateCompositeContract,
  Result,
} from '@shared/contracts/index.ts'

export interface DiscoveryStateCompositeOptions {
  discoveryApplication: DiscoveryApplicationContract
}

/**
 * Aggregates discovery-related data into single responses.
 * Reduces HTTP round-trips for common multi-step operations.
 */
export function createDiscoveryStateComposite(options: DiscoveryStateCompositeOptions): DiscoveryStateCompositeContract {
  const { discoveryApplication } = options

  return {
    async getDiscoveryState(context: AccountContext): Promise<Result<DiscoveryState>> {
      try {
        const accountId = context.accountId
        if (!accountId) {
          return createErrorResult('ACCOUNT_ID_REQUIRED')
        }

        // Parallel: profile + discoveries + spots (independent queries)
        const [profileResult, discoveriesResult, spotsResult] = await Promise.all([
          discoveryApplication.getDiscoveryProfile(context),
          discoveryApplication.getDiscoveries(context),
          discoveryApplication.getDiscoveredSpots(context),
        ])

        if (!profileResult.data) {
          return createErrorResult('GET_PROFILE_ERROR')
        }

        // Sequential: active trail depends on profile
        let activeTrail
        if (profileResult.data.lastActiveTrailId) {
          const trailResult = await discoveryApplication.getDiscoveryTrail(context, profileResult.data.lastActiveTrailId)
          activeTrail = trailResult.data
        }

        return createSuccessResult({
          profile: profileResult.data,
          discoveries: discoveriesResult.data || [],
          spots: spotsResult.data || [],
          activeTrail,
        })
      } catch (error: any) {
        return createErrorResult('DISCOVERY_STATE_ERROR', { originalError: error.message })
      }
    },

    async activateTrail(context: AccountContext, trailId: string): Promise<Result<ActivateTrailResult>> {
      try {
        const accountId = context.accountId
        if (!accountId) {
          return createErrorResult('ACCOUNT_ID_REQUIRED')
        }

        // Step 1: Update profile with new active trail
        const profileResult = await discoveryApplication.updateDiscoveryProfile(context, { lastActiveTrailId: trailId })
        if (!profileResult.data) {
          return createErrorResult('UPDATE_TRAIL_ERROR')
        }

        // Step 2: Parallel – trail data + spots for this trail
        const [trailResult, spotsResult] = await Promise.all([
          discoveryApplication.getDiscoveryTrail(context, trailId),
          discoveryApplication.getDiscoveredSpots(context, trailId),
        ])

        if (!trailResult.data) {
          return createErrorResult('TRAIL_NOT_FOUND')
        }

        return createSuccessResult({
          profile: profileResult.data,
          trail: trailResult.data,
          spots: spotsResult.data || [],
        })
      } catch (error: any) {
        return createErrorResult('DISCOVERY_STATE_ERROR', { originalError: error.message })
      }
    },
  }
}
