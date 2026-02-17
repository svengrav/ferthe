import { Account, AccountSession, Community, CommunityMember, Discovery, DiscoveryApplicationContract, DiscoveryContent, DiscoveryProfile, ImageApplicationContract, SharedDiscovery, SpotRating, StoredSpot, StoredTrail, TrailApplicationContract, TrailRating, TrailSpot, TwilioVerification } from '@shared/contracts/index.ts'
import { Buffer } from "node:buffer"
import { Config, STORE_IDS } from './config/index.ts'
import { SMSConnector } from './connectors/smsConnector.ts'
import { AccountApplicationActions, createAccountApplication } from './features/account/accountApplication.ts'
import { createJWTService } from './features/account/jwtService.ts'
import { createSMSService } from './features/account/smsService.ts'
import { createCommunityApplication } from './features/community/communityApplication.ts'
import { createDiscoveryApplication } from './features/discovery/discoveryApplication.ts'
import { createDiscoveryService } from './features/discovery/discoveryService.ts'
import { createSensorApplication, SensorApplicationActions } from './features/sensor/sensorApplication.ts'
import { createSensorService } from './features/sensor/sensorService.ts'
import { createSpotApplication, SpotApplicationActions } from './features/spot/spotApplication.ts'
import { createTrailApplication } from './features/trail/trailApplication.ts'
import { createImageApplication } from "./shared/images/imageApplication.ts"
import { createStore } from './store/storeFactory.ts'
import { StoreInterface } from './store/storeInterface.ts'

export interface StorageConnector {
  getItemUrl(key: string): Promise<{ id: string; url: string } | null>
  uploadFile(path: string, data: Buffer | string, metadata?: Record<string, string>): Promise<string>
  uploadFileWithPreview(path: string, data: Buffer, previewData: Buffer, metadata?: Record<string, string>): Promise<{ url: string; previewUrl: string }>
  deleteFile(path: string): Promise<void>
  getMetadata(path: string): Promise<Record<string, string>>
}

export interface CoreConnectors {
  storeConnector: StoreInterface
  smsConnector: SMSConnector
  storageConnector: StorageConnector
}

export interface CoreContext {
  readonly config: Config
  discoveryApplication: DiscoveryApplicationContract
  trailApplication: TrailApplicationContract
  spotApplication: SpotApplicationActions
  sensorApplication: SensorApplicationActions
  accountApplication: AccountApplicationActions
  communityApplication: any
  imageApplication?: ImageApplicationContract
}

export function createCoreContext(config: Config, connectors: CoreConnectors): CoreContext {
  const { storeConnector, smsConnector, storageConnector } = connectors

  const imageApplication = createImageApplication({
    storageConnector,
    maxImageSizeBytes: config.constants.images.maxSizeBytes
  })

  const trailApplication = createTrailApplication({
    trailStore: createStore<StoredTrail>(storeConnector, STORE_IDS.TRAILS),
    spotStore: createStore<StoredSpot>(storeConnector, STORE_IDS.SPOTS),
    trailSpotStore: createStore<TrailSpot>(storeConnector, STORE_IDS.TRAIL_SPOTS),
    discoveryStore: createStore<Discovery>(storeConnector, STORE_IDS.DISCOVERIES),
    trailRatingStore: createStore<TrailRating>(storeConnector, STORE_IDS.TRAIL_RATINGS),
    imageApplication,
  })

  const spotApplication = createSpotApplication({
    spotStore: createStore<StoredSpot>(storeConnector, STORE_IDS.SPOTS),
  })

  const accountApplication = createAccountApplication({
    accountStore: createStore<Account>(storeConnector, STORE_IDS.ACCOUNTS),
    accountSessionStore: createStore<AccountSession>(storeConnector, STORE_IDS.ACCOUNT_SESSIONS),
    twilioVerificationStore: createStore<TwilioVerification>(storeConnector, STORE_IDS.ACCOUNT_SMS_CODES),
    smsConnector,
    jwtService: createJWTService({ secret: config.secrets.jwtSecret }),
    smsService: createSMSService({ phoneSalt: config.secrets.phoneHashSalt }),
    imageApplication: imageApplication
  })

  const sensorApplication = createSensorApplication({
    trailApplication: trailApplication,
    scanStore: createStore(storeConnector, STORE_IDS.SENSOR_SCANS),
    sensorService: createSensorService(),
    discoveryStore: createStore(storeConnector, STORE_IDS.DISCOVERIES),
  })

  const discoveryApplication = createDiscoveryApplication({
    sensorApplication: sensorApplication,
    trailApplication: trailApplication,
    discoveryService: createDiscoveryService(),
    discoveryStore: createStore<Discovery>(storeConnector, STORE_IDS.DISCOVERIES),
    profileStore: createStore<DiscoveryProfile>(storeConnector, STORE_IDS.DISCOVERY_PROFILES),
    contentStore: createStore<DiscoveryContent>(storeConnector, STORE_IDS.DISCOVERY_CONTENTS),
    ratingStore: createStore<SpotRating>(storeConnector, STORE_IDS.SPOT_RATINGS),
    imageApplication: imageApplication
  })

  const communityApplication = createCommunityApplication({
    communityStore: {
      communities: createStore<Community>(storeConnector, STORE_IDS.COMMUNITIES),
      members: createStore<CommunityMember>(storeConnector, STORE_IDS.COMMUNITY_MEMBERS),
      ratings: createStore<SpotRating>(storeConnector, STORE_IDS.SPOT_RATINGS),
      discoveries: createStore<SharedDiscovery>(storeConnector, STORE_IDS.COMMUNITY_DISCOVERIES),
    },
    discoveryStore: createStore<Discovery>(storeConnector, STORE_IDS.DISCOVERIES),
    trailSpotStore: createStore<TrailSpot>(storeConnector, STORE_IDS.TRAIL_SPOTS),
  })

  return {
    config: config,
    discoveryApplication,
    trailApplication,
    spotApplication,
    sensorApplication,
    accountApplication,
    communityApplication,
    imageApplication,
  }
}
