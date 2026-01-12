export interface AppEnvironmentConfigSecrets {
  // Secrets that might be needed for the app
  API_SECRET?: string
  ANALYTICS_KEY?: string
}

export interface AppEnvironmentConfig {
  // Environment
  FERTHE_ENV: 'production' | 'development'

  // API Configuration
  API_ENDPOINT: string
  API_TIMEOUT: number

  // Storage Configuration
  STORE_TYPE: 'secure' | 'memory' | 'json'
  JSON_STORE_BASE_DIRECTORY: string

  // Features
  ENABLE_ANALYTICS: boolean
  ENABLE_DEBUG_LOGS: boolean
}

export async function createAppEnvironmentConfig(config: AppEnvironmentConfig): Promise<AppEnvironmentConfig & AppEnvironmentConfigSecrets> {
  const updatedConfig = { ...config } as AppEnvironmentConfig & AppEnvironmentConfigSecrets

  console.log('Creating app environment config for:', updatedConfig.FERTHE_ENV)
  return updatedConfig
}
