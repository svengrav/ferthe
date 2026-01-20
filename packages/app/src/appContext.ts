import { APIContext } from '@app/api/apiContext'
import { AccountSession } from '@shared/contracts'
import { StatusResult } from './api/utils'
import { AccountApplication, createAccountApplication } from './features/account'
import { CommunityApplication, createCommunityApplication } from './features/community/communityApplication'
import { createDiscoveryApplication, DiscoveryApplication } from './features/discovery/discoveryApplication'
import { createMapApplication, MapApplication } from './features/map/mapApplication'
import { DeviceConnector } from './features/sensor/device/types'
import { createSensorApplication, SensorApplication } from './features/sensor/sensorApplication'
import { createTrailApplication, TrailApplication } from './features/trail/trailApplication'
import { SecureStoreConnector } from './shared/device/secureStoreConnector'
import { logger } from './shared/utils/logger'

export interface AppContext {
  readonly config: AppConfiguration
  system: {
    isDevelopment: boolean,
    checkStatus: () => Promise<StatusResult>
  }
  discoveryApplication: DiscoveryApplication
  trailApplication: TrailApplication
  sensorApplication: SensorApplication
  mapApplication: MapApplication
  accountApplication: AccountApplication
  communityApplication: CommunityApplication
}

interface AppConfiguration {
  apiContext?: APIContext
  environment?: 'production' | 'development' | 'test'
  initialSession?: AccountSession
  connectors?: {
    deviceConnector?: DeviceConnector
    secureStoreConnector?: SecureStoreConnector
  }
}

let appInstance: AppContext | null = null

export function createAppContext(config: AppConfiguration = {}): AppContext {
  const { environment = 'production', apiContext, connectors = {}, initialSession } = config

  logger.log(`Initializing ferthe-app with environment: ${environment}`)
  if (!apiContext) throw new Error('Core context is required to initialize the app context')

  const accountApplication = createAccountApplication({
    initialSession: initialSession,
    accountAPI: apiContext.accountApplication,
    secureStore: connectors?.secureStoreConnector,
  })

  const sensorApplication = createSensorApplication({
    getAccountContext: accountApplication.getAccountContext,
    deviceConnector: environment === 'test' ? undefined : connectors?.deviceConnector,
    sensorApplication: apiContext.sensorApplication,
  })

  const discoveryApplication = createDiscoveryApplication({
    getAccountContext: accountApplication.getAccountContext,
    sensor: sensorApplication,
    discoveryAPI: apiContext.discoveryApplication,
  })

  const trailApplication = createTrailApplication({
    getAccountContext: accountApplication.getAccountContext,
    trailAPI: apiContext.trailApplication,
  })

  const mapApplication = createMapApplication({
    sensor: sensorApplication,
    discoveryApplication,
  })

  const communityApplication = createCommunityApplication({
    createCommunity: apiContext.communityApplication.createCommunity,
    joinCommunity: apiContext.communityApplication.joinCommunity,
    leaveCommunity: apiContext.communityApplication.leaveCommunity,
    getCommunity: apiContext.communityApplication.getCommunity,
    listCommunities: apiContext.communityApplication.listCommunities,
    listCommunityMembers: apiContext.communityApplication.listCommunityMembers,
  })

  return {
    config: {
      environment,
    },
    system: {
      isDevelopment: environment === 'development',
      checkStatus: apiContext.system.checkStatus,
    },
    discoveryApplication,
    trailApplication,
    sensorApplication,
    mapApplication,
    accountApplication,
    communityApplication,
  }
}

export function configureAppContext(config: AppConfiguration): AppContext {
  if (appInstance) {
    logger.warn('App context is already configured. Ignoring new configuration.')
  }

  appInstance = createAppContext(config)
  return appInstance
}

export function getAppContext(config?: AppConfiguration): AppContext {
  if (!appInstance) {
    appInstance = createAppContext(config)
  }
  return appInstance
}
