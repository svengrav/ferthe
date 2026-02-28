import { z } from 'zod';
import { GeoLocationSchema } from "../geo/types.ts";
import { AccountContext, AccountPublicProfile } from './accounts.ts';
import { ClueSchema } from './discoveries.ts';
import { ImageReferenceSchema } from "./images.ts";
import { QueryOptions, Result } from './results.ts';
import { Spot } from './spots.ts';

/**
 * Lightweight discovery summary for a single discovery.
 * Omits backend-only fields (trailId, scanEventId, updatedAt).
 */
export const DiscoverySummarySchema = z.object({
  id: z.string(),
  spotId: z.string(),
  discoveredAt: z.date(),
})

export type DiscoverySummary = z.infer<typeof DiscoverySummarySchema>

/**
 * Lightweight spot data for init. Omits backend-only fields
 * (slug, options, updatedAt, createdBy) and strips DiscoverySpot wrapper.
 */
export const SpotSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  image: ImageReferenceSchema.optional(),
  blurredImage: ImageReferenceSchema.optional(),
  location: GeoLocationSchema,
  source: z.string().optional(),
  createdAt: z.date(),
})

export type SpotSummary = z.infer<typeof SpotSummarySchema>

/**
 * Normalized active trail reference. Uses IDs instead of
 * duplicated spot/discovery objects. Trail object is omitted
 * because the app already has it from requestTrailState().
 */
export const ActiveTrailRefSchema = z.object({
  trailId: z.string(),
  spotIds: z.array(z.string()),
  discoveryIds: z.array(z.string()),
  clues: z.array(ClueSchema),
  previewClues: z.array(ClueSchema),
  createdAt: z.date().optional(),
})

export type ActiveTrailRef = z.infer<typeof ActiveTrailRefSchema>

/**
 * Aggregated discovery state returned in a single request.
 * Normalized: spots/discoveries only 1×, activeTrail as ID refs.
 */
export const DiscoveryStateSchema = z.object({
  lastActiveTrailId: z.string().optional(),
  discoveries: z.array(DiscoverySummarySchema),
  spots: z.array(SpotSummarySchema),
  activeTrail: ActiveTrailRefSchema.optional(),
})

export type DiscoveryState = z.infer<typeof DiscoveryStateSchema>

/**
 * Result of activating a trail.
 * Returns clues + ID refs. New spots/discoveries that the app
 * doesn't have yet are included as separate arrays.
 */
export const ActivateTrailResultSchema = z.object({
  activeTrail: ActiveTrailRefSchema,
  spots: z.array(SpotSummarySchema),
  discoveries: z.array(DiscoverySummarySchema),
})

export type ActivateTrailResult = z.infer<typeof ActivateTrailResultSchema>

/**
 * Composite contract for cross-feature queries that require access control.
 * Resolves circular dependencies between spot and discovery domains.
 */
export interface SpotAccessCompositeContract {
  /** Returns only spots the user has discovered */
  getAccessibleSpots: (context: AccountContext, trailId?: string, options?: QueryOptions) => Promise<Result<Spot[]>>
  /** Returns full Spot if discovered/creator, error (DISCOVERY_REQUIRED) otherwise. Use preview endpoint for public access. */
  getAccessibleSpot: (context: AccountContext, spotId: string) => Promise<Result<Spot | undefined>>
}

/**
 * Composite contract for aggregated discovery state operations.
 * Reduces HTTP round-trips by bundling related data.
 */
export interface DiscoveryStateCompositeContract {
  /** Returns full discovery state (profile + discoveries + spots + active trail) */
  getDiscoveryState: (context: AccountContext) => Promise<Result<DiscoveryState>>
  /** Activates a trail and returns updated state */
  activateTrail: (context: AccountContext, trailId: string) => Promise<Result<ActivateTrailResult>>
}

/**
 * Composite contract for assembling account public profile across domains.
 * Combines account data with spot count from the spot domain.
 */
export interface AccountProfileCompositeContract {
  /** Returns public profile with spot count for any account */
  getPublicProfile: (context: AccountContext, accountId: string) => Promise<Result<AccountPublicProfile>>
  /** Returns public profiles for multiple accounts in one request */
  getPublicProfiles: (context: AccountContext, accountIds: string[]) => Promise<Result<AccountPublicProfile[]>>
}

/**
 * Bundles all composite contracts exposed over the API boundary.
 */
export interface CompositeContract {
  spotAccessComposite: SpotAccessCompositeContract
  discoveryStateComposite: DiscoveryStateCompositeContract
  accountProfileComposite: AccountProfileCompositeContract
}
