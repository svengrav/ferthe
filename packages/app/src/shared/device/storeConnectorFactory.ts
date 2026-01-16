import { logger } from "@app/shared/utils/logger"
import { JsonStoreConnector } from './jsonStoreConnector'
import { memoryStoreConnector } from './memoryStoreConnector'
import { SecureStoreConnector, secureStoreConnector } from './secureStoreConnector'

export type StoreType = 'secure' | 'memory' | 'json'

interface StoreConnectorConfig {
  json?: {
    baseDirectory?: string // Optional base directory for JSON files
  }
  type: StoreType
}

/**
 * Factory function to create appropriate store connector based on configuration
 */
export function createStoreConnector(config: StoreConnectorConfig): SecureStoreConnector {
  switch (config.type) {
    case 'memory':
      return memoryStoreConnector
    case 'secure':
      return secureStoreConnector
    case 'json':
      return new JsonStoreConnector()
    default:
      return secureStoreConnector
  }
}

/**
 * Get store connector based on environment
 * Uses memory store in development/testing, secure store in production
 */
export function getStoreConnector(): SecureStoreConnector {
  // Use memory store for testing or development if needed
  const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development'
  const useMemoryStore = process.env.EXPO_PUBLIC_USE_MEMORY_STORE === 'true'

  if (useMemoryStore && isDevelopment) {
    logger.log('Using memory store connector for development/testing')
    return memoryStoreConnector
  }

  return secureStoreConnector
}
