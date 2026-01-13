import { DiscoveryApplicationContract } from "./discoveries.ts"
import { TrailApplicationContract } from "./trails.ts"
import { SpotApplicationContract } from "./spots.ts"
import { SensorApplicationContract } from "./sensors.ts"
import { AccountApplicationContract } from "./accounts.ts"

export interface ApplicationContract {
  discoveryApplication: DiscoveryApplicationContract
  trailApplication: TrailApplicationContract
  spotApplication: SpotApplicationContract
  sensorApplication: SensorApplicationContract
  accountApplication: AccountApplicationContract
}
