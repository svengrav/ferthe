import { Account, AccountSession, Community, CommunityMember, Discovery, DiscoveryApplicationContract, DiscoveryContent, DiscoveryProfile, DiscoveryReaction, ImageApplicationContract, Spot, Trail, TrailApplicationContract, TrailSpot, TwilioVerification } from '@shared/contracts/index.ts'
import { createConsoleSMSConnector, createTwilioSMSConnector, SMSConnector, TwilioConfig } from './connectors/smsConnector.ts'
import { createAzureStorageConnector } from './connectors/storageConnector.ts'
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

export interface CoreConfiguration {
  environment?: 'production' | 'development' | 'test'
  secrets?: {
    jwtSecret?: string
    phoneHashSalt?: string
  }
  connectors?: {
    storeConnector?: StoreInterface
    smsConnector?: SMSConnector
    storageConnector?: {
      connectionString: string
      containerName: string
      sasExpiryMinutes?: number
    }
  }
  twilio?: TwilioConfig
}

export interface CoreContext {
  readonly config: CoreConfiguration
  discoveryApplication: DiscoveryApplicationContract
  trailApplication: TrailApplicationContract
  spotApplication: SpotApplicationActions
  sensorApplication: SensorApplicationActions
  accountApplication: AccountApplicationActions
  communityApplication: any
  imageApplication?: ImageApplicationContract
}

export const INTERNAL_STORE_IDS = {
  TRAILS: 'trail-collection',
  SPOTS: 'spot-collection',
  TRAIL_SPOTS: 'trail-spot-relations',
  ACCOUNTS: 'account-collection',
  ACCOUNT_SESSIONS: 'account-sessions',
  ACCOUNT_SMS_CODES: 'account-sms-codes',
  DISCOVERIES: 'discovery-collection',
  DISCOVERY_PROFILES: 'discovery-profile-collection',
  DISCOVERY_CONTENTS: 'discovery-content-collection',
  DISCOVERY_REACTIONS: 'discovery-reactions',
  SENSOR_SCANS: 'sensor-scans',
  COMMUNITIES: 'community-collection',
  COMMUNITY_MEMBERS: 'community-members',
}

export function createCoreContext(config: CoreConfiguration = {}): CoreContext {
  const { connectors } = config
  const storeConnector = connectors?.storeConnector

  if (!storeConnector) {
    throw new Error('Store connector is required to create CoreContext')
  }

  // Create SMS connector based on configuration
  const smsConnector = connectors?.smsConnector || (config.twilio ? createTwilioSMSConnector(config.twilio) : createConsoleSMSConnector())

  // Create image application if storage connector is configured
  let imageApplication: ImageApplicationContract | undefined
  if (connectors?.storageConnector) {
    const storageConnector = createAzureStorageConnector(
      connectors.storageConnector.connectionString,
      connectors.storageConnector.containerName,
      { sasExpiryMinutes: connectors.storageConnector.sasExpiryMinutes }
    )
    imageApplication = createImageApplication({ storageConnector })
  }


  const trailApplication = createTrailApplication({
    trailStore: createStore<Trail>(storeConnector, INTERNAL_STORE_IDS.TRAILS),
    spotStore: createStore<Spot>(storeConnector, INTERNAL_STORE_IDS.SPOTS),
    trailSpotStore: createStore<TrailSpot>(storeConnector, INTERNAL_STORE_IDS.TRAIL_SPOTS),
  })

  const spotApplication = createSpotApplication({
    spotStore: createStore<Spot>(storeConnector, INTERNAL_STORE_IDS.SPOTS),
  })

  const accountApplication = createAccountApplication({
    accountStore: createStore<Account>(storeConnector, INTERNAL_STORE_IDS.ACCOUNTS),
    accountSessionStore: createStore<AccountSession>(storeConnector, INTERNAL_STORE_IDS.ACCOUNT_SESSIONS),
    twilioVerificationStore: createStore<TwilioVerification>(storeConnector, INTERNAL_STORE_IDS.ACCOUNT_SMS_CODES),
    smsConnector,
    jwtService: createJWTService({ secret: config.secrets?.jwtSecret }),
    smsService: createSMSService({ phoneSalt: config.secrets?.phoneHashSalt }),
  })

  const sensorApplication = createSensorApplication({
    trailApplication: trailApplication,
    scanStore: createStore(storeConnector, INTERNAL_STORE_IDS.SENSOR_SCANS),
    sensorService: createSensorService(),
    discoveryStore: createStore(storeConnector, INTERNAL_STORE_IDS.DISCOVERIES),
  })

  const discoveryApplication = createDiscoveryApplication({
    sensorApplication: sensorApplication,
    trailApplication: trailApplication,
    discoveryService: createDiscoveryService(),
    discoveryStore: createStore<Discovery>(storeConnector, INTERNAL_STORE_IDS.DISCOVERIES),
    profileStore: createStore<DiscoveryProfile>(storeConnector, INTERNAL_STORE_IDS.DISCOVERY_PROFILES),
    contentStore: createStore<DiscoveryContent>(storeConnector, INTERNAL_STORE_IDS.DISCOVERY_CONTENTS),
    reactionStore: createStore<DiscoveryReaction>(storeConnector, INTERNAL_STORE_IDS.DISCOVERY_REACTIONS),
    imageApplication,
  })

  const communityApplication = createCommunityApplication({
    communityStore: {
      communities: createStore<Community>(storeConnector, INTERNAL_STORE_IDS.COMMUNITIES),
      members: createStore<CommunityMember>(storeConnector, INTERNAL_STORE_IDS.COMMUNITY_MEMBERS),
      reactions: createStore<DiscoveryReaction>(storeConnector, INTERNAL_STORE_IDS.DISCOVERY_REACTIONS),
    },
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

export const getCoreStoreIdentifiers = () => INTERNAL_STORE_IDS
