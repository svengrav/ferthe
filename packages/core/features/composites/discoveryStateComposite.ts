import type { Discovery, DiscoverySpot } from '@shared/contracts/discoveries.ts'
import {
  AccountContext,
  ActivateTrailResult,
  ActiveTrailRef,
  createErrorResult,
  createSuccessResult,
  DiscoveryApplicationContract,
  DiscoveryState,
  DiscoveryStateCompositeContract,
  DiscoverySummary,
  Result,
  SpotSummary,
} from '@shared/contracts/index.ts'

export interface DiscoveryStateCompositeOptions {
  discoveryApplication: DiscoveryApplicationContract
}

// Project Discovery → DiscoverySummary (drop trailId, scanEventId, updatedAt, accountId)
const toDiscoverySummary = (d: Discovery): DiscoverySummary => ({
  id: d.id,
  spotId: d.spotId,
  discoveredAt: d.discoveredAt,
})

// Project DiscoverySpot → SpotSummary (drop slug, options, updatedAt, createdBy, discoveryId, discoveredAt)
const toSpotSummary = (s: DiscoverySpot): SpotSummary => ({
  id: s.id,
  name: s.name,
  description: s.description,
  image: s.image ? { id: s.image.id, url: s.image.url } : undefined,
  blurredImage: s.blurredImage ? { id: s.blurredImage.id, url: s.blurredImage.url } : undefined,
  location: { lat: s.location.lat, lon: s.location.lon },
  source: s.source,
  createdAt: s.createdAt,
})

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

        const lastActiveTrailId = profileResult.data.lastActiveTrailId

        // Sequential: active trail depends on profile
        let activeTrail: ActiveTrailRef | undefined
        if (lastActiveTrailId) {
          const trailResult = await discoveryApplication.getDiscoveryTrail(context, lastActiveTrailId)
          if (trailResult.data) {
            activeTrail = {
              trailId: lastActiveTrailId,
              spotIds: trailResult.data.spots.map(s => s.id),
              discoveryIds: trailResult.data.discoveries.map(d => d.id),
              clues: trailResult.data.clues,
              previewClues: trailResult.data.previewClues || [],
              createdAt: trailResult.data.createdAt,
            }
          }
        }

        return createSuccessResult({
          lastActiveTrailId,
          discoveries: (discoveriesResult.data || []).map(toDiscoverySummary),
          spots: (spotsResult.data || []).map(toSpotSummary),
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

        const activeTrail: ActiveTrailRef = {
          trailId,
          spotIds: trailResult.data.spots.map(s => s.id),
          discoveryIds: trailResult.data.discoveries.map(d => d.id),
          clues: trailResult.data.clues,
          previewClues: trailResult.data.previewClues || [],
          createdAt: trailResult.data.createdAt,
        }

        return createSuccessResult({
          activeTrail,
          spots: (spotsResult.data || []).map(toSpotSummary),
          discoveries: trailResult.data.discoveries.map(toDiscoverySummary),
        })
      } catch (error: any) {
        return createErrorResult('DISCOVERY_STATE_ERROR', { originalError: error.message })
      }
    },
  }
}
