import { Account, AccountSession, APIContract, Community, CommunityMember, DeviceToken, Discovery, DiscoveryContent, DiscoveryProfile, ImageApplicationContract, SharedDiscovery, SpotRating, StoredSpot, StoredTrail, StoredTrailSpot, TrailRating, TwilioVerification } from '@shared/contracts/index.ts'
import { Buffer } from "node:buffer"
import { Config, STORE_IDS } from './config/index.ts'
import { createFirebaseConnector, FirebaseConnector } from './connectors/firebaseConnector.ts'
import { SMSConnector } from './connectors/smsConnector.ts'
import { AccountApplicationActions, createAccountApplication } from './features/account/accountApplication.ts'
import { createJWTService } from './features/account/jwtService.ts'
import { createSMSService } from './features/account/smsService.ts'
import { createCommunityApplication } from './features/community/communityApplication.ts'
import { createAccountProfileComposite } from './features/composites/accountProfileComposite.ts'
import { createDiscoveryStateComposite } from './features/composites/discoveryStateComposite.ts'
import { createSpotAccessComposite } from './features/composites/spotAccessComposite.ts'
import { createDiscoveryApplication } from './features/discovery/discoveryApplication.ts'
import { createDiscoveryService } from './features/discovery/discoveryService.ts'
import { createNotificationService, NotificationService } from './features/notification/notificationService.ts'
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
  deleteFile(path: string): Promise<void>
  getMetadata(path: string): Promise<Record<string, string>>
}

export interface CoreConnectors {
  storeConnector: StoreInterface
  smsConnector: SMSConnector
  storageConnector: StorageConnector
}

export interface CoreContext extends APIContract {
  readonly config: Config
  spotApplication: SpotApplicationActions
  sensorApplication: SensorApplicationActions
  accountApplication: AccountApplicationActions
  communityApplication: any
  imageApplication?: ImageApplicationContract
  notificationService: NotificationService
}

export function createCoreContext(config: Config, connectors: CoreConnectors): CoreContext {
  const { storeConnector, smsConnector, storageConnector } = connectors

  const imageApplication = createImageApplication({
    storageConnector,
    maxImageSizeBytes: config.constants.images.maxSizeBytes
  })

  const spotApplication = createSpotApplication({
    spotStore: createStore<StoredSpot>(storeConnector, STORE_IDS.SPOTS),
    ratingStore: createStore<SpotRating>(storeConnector, STORE_IDS.SPOT_RATINGS),
    imageApplication,
  })

  const trailApplication = createTrailApplication({
    trailStore: createStore<StoredTrail>(storeConnector, STORE_IDS.TRAILS),
    trailSpotStore: createStore<StoredTrailSpot>(storeConnector, STORE_IDS.TRAIL_SPOTS),
    trailRatingStore: createStore<TrailRating>(storeConnector, STORE_IDS.TRAIL_RATINGS),
    imageApplication,
    spotApplication,
  })

  // Late-bind trailApplication to spotApplication (avoids circular init dependency)
  spotApplication.setTrailApplication(trailApplication)

  const accountApplication = createAccountApplication({
    accountStore: createStore<Account>(storeConnector, STORE_IDS.ACCOUNTS),
    accountSessionStore: createStore<AccountSession>(storeConnector, STORE_IDS.ACCOUNT_SESSIONS),
    twilioVerificationStore: createStore<TwilioVerification>(storeConnector, STORE_IDS.ACCOUNT_SMS_CODES),
    deviceTokenStore: createStore<DeviceToken>(storeConnector, STORE_IDS.DEVICE_TOKENS),
    smsConnector,
    jwtService: createJWTService({ secret: config.secrets.jwtSecret }),
    smsService: createSMSService({ phoneSalt: config.secrets.phoneHashSalt }),
    imageApplication: imageApplication
  })

  const sensorApplication = createSensorApplication({
    trailApplication: trailApplication,
    spotApplication: spotApplication,
    scanStore: createStore(storeConnector, STORE_IDS.SENSOR_SCANS),
    sensorService: createSensorService(),
    discoveryStore: createStore(storeConnector, STORE_IDS.DISCOVERIES),
  })

  const discoveryApplication = createDiscoveryApplication({
    sensorApplication: sensorApplication,
    trailApplication: trailApplication,
    spotApplication: spotApplication,
    discoveryService: createDiscoveryService(),
    discoveryStore: createStore<Discovery>(storeConnector, STORE_IDS.DISCOVERIES),
    profileStore: createStore<DiscoveryProfile>(storeConnector, STORE_IDS.DISCOVERY_PROFILES),
    contentStore: createStore<DiscoveryContent>(storeConnector, STORE_IDS.DISCOVERY_CONTENTS),
    imageApplication: imageApplication
  })

  // Composites: cross-feature aggregation, created after all applications
  const spotAccessComposite = createSpotAccessComposite({
    discoveryApplication,
    spotApplication,
  })

  const discoveryStateComposite = createDiscoveryStateComposite({
    discoveryApplication,
    spotApplication,
  })

  const accountProfileComposite = createAccountProfileComposite({
    accountApplication,
    spotApplication,
  })

  const communityApplication = createCommunityApplication({
    communityStore: {
      communities: createStore<Community>(storeConnector, STORE_IDS.COMMUNITIES),
      members: createStore<CommunityMember>(storeConnector, STORE_IDS.COMMUNITY_MEMBERS),
      ratings: createStore<SpotRating>(storeConnector, STORE_IDS.SPOT_RATINGS),
      discoveries: createStore<SharedDiscovery>(storeConnector, STORE_IDS.COMMUNITY_DISCOVERIES),
    },
    discoveryStore: createStore<Discovery>(storeConnector, STORE_IDS.DISCOVERIES),
    trailSpotStore: createStore<StoredTrailSpot>(storeConnector, STORE_IDS.TRAIL_SPOTS),
    accountProfileComposite,
  })

  // Firebase push connector (optional, requires service account)
  let firebaseConnector: FirebaseConnector | undefined
  if (config.secrets.firebaseServiceAccount) {
    firebaseConnector = createFirebaseConnector(config.secrets.firebaseServiceAccount)
    console.log('[Firebase] Push notification connector initialized')
  } else {
    console.log('[Firebase] No service account configured — push notifications disabled')
  }

  const notificationService = createNotificationService({
    deviceTokenStore: createStore<DeviceToken>(storeConnector, STORE_IDS.DEVICE_TOKENS),
    firebaseConnector,
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
    notificationService,
    spotAccessComposite,
    discoveryStateComposite,
    accountProfileComposite,
  }
}
