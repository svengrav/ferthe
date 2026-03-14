import { config } from '@app/config'
import { APIContext } from '@app/api/apiContext'
import { ApiClient } from '@shared/api'
import { AccountSession } from '@shared/contracts'
import { StatusResult } from './api/utils'
import { AccountApplication, createAccountApplication } from './features/account'
import { CommunityApplication, createCommunityApplication } from './features/community/application'
import { createDiscoveryApplication, DiscoveryApplication } from './features/discovery/application'
import { createMapApplication, MapApplication } from './features/map/application'
import { createSensorApplication, SensorApplication } from './features/sensor/application'
import { DeviceConnector } from './features/sensor/device/types'
import { createSpotApplication, SpotApplication } from './features/spot/application'
import { createStoryApplication, StoryApplication } from './features/story/application'
import { createStumbleApplication, StumbleApplication } from './features/stumble/stumbleApplication'
import { createTrailApplication, TrailApplication } from './features/trail/application'
import { SecureStoreConnector } from './shared/device/secureStoreConnector'
import { initLogger, logger } from './shared/utils/logger'

export interface AppContext {
  readonly config: AppConfiguration
  readonly api: ApiClient
  system: {
    isDevelopment: boolean
    checkStatus: () => Promise<StatusResult>
  }
  discoveryApplication: DiscoveryApplication
  storyApplication: StoryApplication
  trailApplication: TrailApplication
  sensorApplication: SensorApplication
  spotApplication: SpotApplication
  mapApplication: MapApplication
  accountApplication: AccountApplication
  communityApplication: CommunityApplication
  stumbleApplication: StumbleApplication
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

  initLogger(environment === 'development')
  logger.log(`Initializing ferthe-app with environment: ${environment}`)
  if (!apiContext) throw new Error('Core context is required to initialize the app context')

  const { api } = apiContext

  const accountApplication = createAccountApplication({
    initialSession,
    api,
    secureStore: connectors?.secureStoreConnector,
  })

  const sensorApplication = createSensorApplication({
    api,
    deviceConnector: environment === 'test' ? undefined : connectors?.deviceConnector,
  })

  const discoveryApplication = createDiscoveryApplication({
    api,
    sensor: sensorApplication,
  })

  const trailApplication = createTrailApplication({ api })

  const spotApplication = createSpotApplication({ api })

  const storyApplication = createStoryApplication({ api })

  const mapApplication = createMapApplication({
    sensor: sensorApplication,
    discoveryApplication,
  })

  const communityApplication = createCommunityApplication({ api })

  return {
    config: { environment },
    api,
    system: {
      isDevelopment: config.environment === 'development',
      checkStatus: apiContext.system.checkStatus,
    },
    discoveryApplication,
    storyApplication,
    trailApplication,
    sensorApplication,
    spotApplication,
    mapApplication,
    accountApplication,
    communityApplication,
    stumbleApplication: createStumbleApplication({ api }),
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
