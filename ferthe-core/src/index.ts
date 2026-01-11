// Main entry point for ferthe-core package

// Core context
export { createCoreContext, getCoreStoreIdentifiers } from './core'
export type { CoreConfiguration, CoreContext } from './core'

// Store interfaces and factories
export { createCosmosStore } from './store/cosmosStore'
export { createMemoryStore } from './store/memoryStore'
export type { StoreInterface } from './store/storeInterface'

// Discovery feature
export { createDiscoveryApplication } from './features/discovery/discoveryApplication'
export { createDiscoveryService } from './features/discovery/discoveryService'

// Trail feature
export { createTrailApplication } from './features/trail/trailApplication'

// Spot feature
export { createSpotApplication } from './features/spot/spotApplication'
export type { SpotApplicationActions } from './features/spot/spotApplication'

// Account feature
export { createAccountApplication } from './features/account/accountApplication'
export type { AccountApplicationActions } from './features/account/accountApplication'
export { createSMSService } from './features/account/smsService'
export type { SMSService } from './features/account/smsService'

// SMS Connector
export { createConsoleSMSConnector, createTwilioSMSConnector } from './connectors/smsConnector'
export type { SMSConnector, SMSRequest, SMSResponse, TwilioConfig } from './connectors/smsConnector'

// Sensor feature
export { createSensorApplication } from './features/sensor/sensorApplication'
export type { SensorApplicationActions } from './features/sensor/sensorApplication'
