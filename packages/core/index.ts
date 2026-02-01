// Main entry point for ferthe-core package

// Core context
export { createCoreContext } from './core.ts'
export type { CoreConnectors, CoreContext, StorageConnector } from './core.ts'

// Store interfaces and factories
export { createCosmosStore } from './store/cosmosStore.ts'
export { createMemoryStore } from './store/memoryStore.ts'
export type { StoreInterface } from './store/storeInterface.ts'

// Discovery feature
export { createDiscoveryApplication } from './features/discovery/discoveryApplication.ts'
export { createDiscoveryService } from './features/discovery/discoveryService.ts'

// Trail feature
export { createTrailApplication } from './features/trail/trailApplication.ts'

// Spot feature
export { createSpotApplication } from './features/spot/spotApplication.ts'
export type { SpotApplicationActions } from './features/spot/spotApplication.ts'

// Account feature
export { createAccountApplication } from './features/account/accountApplication.ts'
export type { AccountApplicationActions } from './features/account/accountApplication.ts'
export { createSMSService } from './features/account/smsService.ts'
export type { SMSService } from './features/account/smsService.ts'

// SMS Connector
export { createConsoleSMSConnector, createTwilioSMSConnector } from './connectors/smsConnector.ts'
export type { SMSConnector, TwilioConfig } from './connectors/smsConnector.ts'

// Sensor feature
export { createSensorApplication } from './features/sensor/sensorApplication.ts'
export type { SensorApplicationActions } from './features/sensor/sensorApplication.ts'

// Community feature
export { createCommunityApplication } from './features/community/communityApplication.ts'

// Image utilities (shared infrastructure)
export { createImageApplication } from './shared/images/imageApplication.ts'
export { createImageMetadata, detectExtensionFromDataUri, extractBlobPathFromUrl, generateSecureImagePath, isSupportedExtension } from './shared/images/imageService.ts'

// Storage Connector
export { createAzureStorageConnector } from './connectors/storageConnector.ts'

