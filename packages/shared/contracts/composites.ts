import { GeoLocation } from "../geo/types.ts";
import { AccountContext } from './accounts.ts';
import { Clue } from './discoveries.ts';
import { ImageReference } from "./images.ts";
import { QueryOptions, Result } from './results.ts';
import { Spot } from './spots.ts';

/**
 * Lightweight discovery summary for a single discovery.
 * Omits backend-only fields (trailId, scanEventId, updatedAt).
 */
export interface DiscoverySummary {
  id: string
  spotId: string
  discoveredAt: Date
}

/**
 * Lightweight spot data for init. Omits backend-only fields
 * (slug, options, updatedAt, createdBy) and strips DiscoverySpot wrapper.
 */
export interface SpotSummary {
  id: string
  name: string
  description: string
  image?: ImageReference
  blurredImage?: ImageReference
  location: GeoLocation
  source?: string
  createdAt: Date
}

/**
 * Normalized active trail reference. Uses IDs instead of
 * duplicated spot/discovery objects. Trail object is omitted
 * because the app already has it from requestTrailState().
 */
export interface ActiveTrailRef {
  trailId: string
  spotIds: string[]
  discoveryIds: string[]
  clues: Clue[]
  previewClues: Clue[]
  createdAt?: Date
}

/**
 * Aggregated discovery state returned in a single request.
 * Normalized: spots/discoveries only 1×, activeTrail as ID refs.
 */
export interface DiscoveryState {
  lastActiveTrailId?: string
  discoveries: DiscoverySummary[]
  spots: SpotSummary[]
  activeTrail?: ActiveTrailRef
}

/**
 * Result of activating a trail.
 * Returns clues + ID refs. New spots/discoveries that the app
 * doesn't have yet are included as separate arrays.
 */
export interface ActivateTrailResult {
  activeTrail: ActiveTrailRef
  spots: SpotSummary[]
  discoveries: DiscoverySummary[]
}

/**
 * Composite contract for cross-feature queries that require access control.
 * Resolves circular dependencies between spot and discovery domains.
 */
export interface SpotAccessCompositeContract {
  /** Returns only spots the user has discovered */
  getAccessibleSpots: (context: AccountContext, trailId?: string, options?: QueryOptions) => Promise<Result<Spot[]>>
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
 * Bundles all composite contracts exposed over the API boundary.
 */
export interface CompositeContract {
  spotAccessComposite: SpotAccessCompositeContract
  discoveryStateComposite: DiscoveryStateCompositeContract
}
