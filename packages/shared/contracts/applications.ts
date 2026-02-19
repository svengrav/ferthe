import { AccountApplicationContract } from "./accounts.ts"
import { CommunityApplicationContract } from "./communities.ts"
import { CompositeContract } from "./composites.ts"
import { DiscoveryApplicationContract } from "./discoveries.ts"
import { SensorApplicationContract } from "./sensors.ts"
import { SpotApplicationContract } from "./spots.ts"
import { TrailApplicationContract } from "./trails.ts"

export interface ApplicationContract {
  discoveryApplication: DiscoveryApplicationContract
  trailApplication: TrailApplicationContract
  spotApplication: SpotApplicationContract
  sensorApplication: SensorApplicationContract
  accountApplication: AccountApplicationContract
  communityApplication: CommunityApplicationContract
}

/**
 * Full API contract exposed over the HTTP boundary.
 * Used by both Core (server) and App (client) to ensure type-safe communication.
 */
export type APIContract = ApplicationContract & CompositeContract
