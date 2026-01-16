import { logger } from "@app/shared/utils/logger"

export interface AppEnvironmentConfigSecrets {
  // Secrets that might be needed for the app
  API_SECRET?: string
  ANALYTICS_KEY?: string
}

export interface AppEnvironmentConfig {
  // Environment
  ENV_TYPE: 'production' | 'development'

  // API Configuration
  API_ENDPOINT: string
  API_TIMEOUT: number

  // Storage Configuration
  STORE_TYPE: 'secure' | 'memory' | 'json'
  JSON_STORE_BASE_DIRECTORY: string

  // Features
  ENABLE_LOGGER: boolean
  ENABLE_ANALYTICS: boolean
  ENABLE_DEBUG_LOGS: boolean
}

export function createAppEnvironmentConfig(config: AppEnvironmentConfig): AppEnvironmentConfig & AppEnvironmentConfigSecrets {
  const updatedConfig = { ...config } as AppEnvironmentConfig & AppEnvironmentConfigSecrets

  logger.log('Creating app environment config for:', updatedConfig.ENV_TYPE)
  return updatedConfig
}
