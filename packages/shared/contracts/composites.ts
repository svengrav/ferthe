import { AccountContext } from './accounts.ts'
import { Discovery, DiscoverySpot, DiscoveryTrail } from './discoveries.ts'
import { DiscoveryProfile } from './discoveryProfile.ts'
import { QueryOptions, Result } from './results.ts'
import { Spot } from './spots.ts'

/**
 * Aggregated discovery state returned in a single request.
 * Used for initial app load and trail changes.
 */
export interface DiscoveryState {
  profile: DiscoveryProfile
  discoveries: Discovery[]
  spots: DiscoverySpot[]
  activeTrail?: DiscoveryTrail
}

/**
 * Result of activating a trail (profile update + trail data).
 */
export interface ActivateTrailResult {
  profile: DiscoveryProfile
  trail: DiscoveryTrail
  spots: DiscoverySpot[]
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
