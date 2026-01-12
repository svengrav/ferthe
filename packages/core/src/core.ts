import { Account, AccountSession, Discovery, DiscoveryApplicationContract, DiscoveryProfile, SMSCode, Spot, Trail, TrailApplicationContract } from '@shared/contracts'
import { createJWTService } from './features/account/jwtService'
import { createConsoleSMSConnector, createTwilioSMSConnector, SMSConnector, TwilioConfig } from './connectors/smsConnector'
import { AccountApplicationActions, createAccountApplication } from './features/account/accountApplication'
import { createSMSService } from './features/account/smsService'
import { createDiscoveryApplication } from './features/discovery/discoveryApplication'
import { createDiscoveryService } from './features/discovery/discoveryService'
import { createSensorApplication, SensorApplicationActions } from './features/sensor/sensorApplication'
import { createSensorService } from './features/sensor/sensorService'
import { createSpotApplication, SpotApplicationActions } from './features/spot/spotApplication'
import { createTrailApplication } from './features/trail/trailApplication'
import { createStore } from './store/storeFactory'
import { StoreInterface } from './store/storeInterface'

export interface CoreConfiguration {
  environment?: 'production' | 'development' | 'test'
  secrets?: {
    jwtSecret?: string
    phoneHashSalt?: string
  }
  connectors?: {
    storeConnector?: StoreInterface
    smsConnector?: SMSConnector
    assetConnector?: any // Define a more specific type if available
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
}

export const INTERNAL_STORE_IDS = {
  TRAILS: 'trail-collection',
  TRAIL_SPOTS: 'spot-collection',
  ACCOUNTS: 'account-collection',
  ACCOUNT_SESSIONS: 'account-sessions',
  ACCOUNT_SMS_CODES: 'account-sms-codes',
  DISCOVERIES: 'discovery-collection',
  DISCOVERY_PROFILES: 'discovery-profile-collection',
  SENSOR_SCANS: 'sensor-scans',
}

export function createCoreContext(config: CoreConfiguration = {}): CoreContext {
  const { connectors } = config
  const storeConnector = connectors?.storeConnector

  if (!storeConnector) {
    throw new Error('Store connector is required to create CoreContext')
  }

  // Create SMS connector based on configuration
  const smsConnector = connectors?.smsConnector || (config.twilio ? createTwilioSMSConnector(config.twilio) : createConsoleSMSConnector())

  const trailApplication = createTrailApplication({
    trailStore: createStore<Trail>(storeConnector, INTERNAL_STORE_IDS.TRAILS),
    spotStore: createStore<Spot>(storeConnector, INTERNAL_STORE_IDS.TRAIL_SPOTS),
  })

  const spotApplication = createSpotApplication({
    spotStore: createStore<Spot>(storeConnector, INTERNAL_STORE_IDS.TRAIL_SPOTS),
  })

  const accountApplication = createAccountApplication({
    accountStore: createStore<Account>(storeConnector, INTERNAL_STORE_IDS.ACCOUNTS),
    accountSessionStore: createStore<AccountSession>(storeConnector, INTERNAL_STORE_IDS.ACCOUNT_SESSIONS),
    smsCodeStore: createStore<SMSCode>(storeConnector, INTERNAL_STORE_IDS.ACCOUNT_SMS_CODES),
    smsConnector,
    jwtService: createJWTService({ secret: config.secrets?.jwtSecret }),
    smsService: createSMSService({ phoneSalt: config.secrets?.phoneHashSalt }),
  })

  const sensorApplication = createSensorApplication({
    trailApplication: trailApplication,
    scanStore: createStore(storeConnector, INTERNAL_STORE_IDS.SENSOR_SCANS),
    sensorService: createSensorService(),
  })

  const discoveryApplication = createDiscoveryApplication({
    sensorApplication: sensorApplication,
    trailApplication: trailApplication,
    discoveryService: createDiscoveryService(),
    discoveryStore: createStore<Discovery>(storeConnector, INTERNAL_STORE_IDS.DISCOVERIES),
    profileStore: createStore<DiscoveryProfile>(storeConnector, INTERNAL_STORE_IDS.DISCOVERY_PROFILES),
  })

  return {
    config: config,
    discoveryApplication,
    trailApplication,
    spotApplication,
    sensorApplication,
    accountApplication,
  }
}

export const getCoreStoreIdentifiers = () => INTERNAL_STORE_IDS
