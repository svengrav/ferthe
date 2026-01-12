import { DiscoveryApplicationContract } from "./discoveries";
import { TrailApplicationContract } from "./trails";
import { SpotApplicationContract } from "./spots";
import { SensorApplicationContract } from "./sensors";
import { AccountApplicationContract } from "./accounts";
export interface ApplicationContract {
    discoveryApplication: DiscoveryApplicationContract;
    trailApplication: TrailApplicationContract;
    spotApplication: SpotApplicationContract;
    sensorApplication: SensorApplicationContract;
    accountApplication: AccountApplicationContract;
}
