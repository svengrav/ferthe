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
  SpotApplicationContract,
  SpotSummary,
} from '@shared/contracts/index.ts'
import type { Spot } from '@shared/contracts/spots.ts'

export interface DiscoveryStateCompositeOptions {
  discoveryApplication: DiscoveryApplicationContract
  spotApplication: SpotApplicationContract
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

// Project Spot → SpotSummary for creator-owned spots
const createdSpotToSpotSummary = (s: Spot): SpotSummary => ({
  id: s.id,
  name: s.name,
  description: s.description,
  image: s.image ? { id: s.image.id, url: s.image.url } : undefined,
  blurredImage: s.blurredImage ? { id: s.blurredImage.id, url: s.blurredImage.url } : undefined,
  location: { lat: s.location.lat, lon: s.location.lon },
  source: 'created',
  createdAt: s.createdAt,
})

/**
 * Aggregates discovery-related data into single responses.
 * Reduces HTTP round-trips for common multi-step operations.
 */
export function createDiscoveryStateComposite(options: DiscoveryStateCompositeOptions): DiscoveryStateCompositeContract {
  const { discoveryApplication, spotApplication } = options

  return {
    async getDiscoveryState(context: AccountContext): Promise<Result<DiscoveryState>> {
      try {
        const accountId = context.accountId
        if (!accountId) {
          return createErrorResult('ACCOUNT_ID_REQUIRED')
        }

        // Parallel: profile + discoveries + discovered spots + created spots
        const [profileResult, discoveriesResult, spotsResult, createdSpotsResult] = await Promise.all([
          discoveryApplication.getDiscoveryProfile(context),
          discoveryApplication.getDiscoveries(context),
          discoveryApplication.getDiscoveredSpots(context),
          spotApplication.getSpots(context, { filters: { createdBy: accountId } }),
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

        // Merge discovered spots + created spots (deduplicated by id, created takes priority)
        const discoveredSpots = (spotsResult.data || []).map(toSpotSummary)
        const createdSpots = (createdSpotsResult.data || []).map(createdSpotToSpotSummary)
        const discoveredSpotIds = new Set(createdSpots.map(s => s.id))
        const mergedSpots = [
          ...createdSpots,
          ...discoveredSpots.filter(s => !discoveredSpotIds.has(s.id)),
        ]

        return createSuccessResult({
          lastActiveTrailId,
          discoveries: (discoveriesResult.data || []).map(toDiscoverySummary),
          spots: mergedSpots,
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

        // Step 2: Parallel – trail data + discovered spots for this trail + created spots by user
        const [trailResult, spotsResult, createdSpotsResult] = await Promise.all([
          discoveryApplication.getDiscoveryTrail(context, trailId),
          discoveryApplication.getDiscoveredSpots(context, trailId),
          spotApplication.getSpots(context, { filters: { createdBy: accountId } }),
        ])

        if (!trailResult.data) {
          return createErrorResult('TRAIL_NOT_FOUND')
        }

        // Merge discovered spots + created spots + public spots (deduplicated by id, created takes priority)
        const discoveredSpots = (spotsResult.data || []).map(toSpotSummary)
        const createdSpots = (createdSpotsResult.data || []).map(createdSpotToSpotSummary)
        const createdSpotIds = new Set(createdSpots.map(s => s.id))

        // Extract public spots (visibility='public', not owned by user)
        const publicSpots = trailResult.data.spots
          .filter(s => s.options.visibility === 'public' && s.createdBy !== accountId)
          .map(s => ({
            ...toSpotSummary({ ...s, discoveryId: '', discoveredAt: new Date() } as DiscoverySpot),
            source: 'public' as const
          }))
        const publicSpotIds = new Set(publicSpots.map(s => s.id))

        const mergedSpots = [
          ...createdSpots,
          ...publicSpots,
          ...discoveredSpots.filter(s => !createdSpotIds.has(s.id) && !publicSpotIds.has(s.id)),
        ]

        // Merge spotIds: trail spots + created spots (public spots are in trail spots)
        const trailSpotIds = trailResult.data.spots.map(s => s.id)
        const allSpotIds = Array.from(new Set([...trailSpotIds, ...createdSpots.map(s => s.id)]))

        const activeTrail: ActiveTrailRef = {
          trailId,
          spotIds: allSpotIds,
          discoveryIds: trailResult.data.discoveries.map(d => d.id),
          clues: trailResult.data.clues,
          previewClues: trailResult.data.previewClues || [],
          createdAt: trailResult.data.createdAt,
        }

        return createSuccessResult({
          activeTrail,
          spots: mergedSpots,
          discoveries: trailResult.data.discoveries.map(toDiscoverySummary),
        })
      } catch (error: any) {
        return createErrorResult('DISCOVERY_STATE_ERROR', { originalError: error.message })
      }
    },
  }
}
