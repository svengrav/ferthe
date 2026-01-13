import { createKeyVaultConnector } from '../../connectors/azureKeyVaultConnector.ts'

export interface EnvironmentConfigSecrets {
  STORAGE_ACCESS_KEY: string
  JWT_SIGN_KEY: string
  COSMOS_CONNECTION_STRING: string
  TWILIO_ACCESS_KEY: string
  PHONE_HASH_SALT: string
}

export interface EnvironmentConfig {
  FERTHE_ENV: 'production' | 'development'
  API_PORT: string
  API_HOST: string
  API_PREFIX: string
  ORIGINS: string[]

  // KeyVault & Secrets
  KEY_VAULT_NAME: string
  STORAGE_ACCESS_KEY_ID: string
  JWT_SIGN_KEY_ID: string
  COSMOS_CONNECTION_STRING_ID: string
  TWILIO_ACCESS_KEY_ID: string
  PHONE_HASH_SALT_ID: string

  // Stores
  STORE_TYPE?: 'cosmos' | 'json' | 'memory'
  COSMOS_DATABASE_NAME: string
  JSON_STORE_BASE_DIRECTORY: string
}

export async function createEnvironmentConfig(config: EnvironmentConfig): Promise<EnvironmentConfig & EnvironmentConfigSecrets> {
  const updatedConfig = { ...config } as EnvironmentConfig & EnvironmentConfigSecrets
  console.log('Creating environment config with:', updatedConfig)
  // Load secrets from Azure Key Vault if in production environment
  if (config.FERTHE_ENV === 'production') {
    console.warn('This is production! Loading secrets from Azure Key Vault...')
    const keyVaultConnector = createKeyVaultConnector(config.KEY_VAULT_NAME)
    const [storageSecret, jwtSecret, cosmosSecret, twilioSecret, phoneSecret] = await Promise.all([
      keyVaultConnector.getSecret(config.STORAGE_ACCESS_KEY_ID),
      keyVaultConnector.getSecret(config.JWT_SIGN_KEY_ID),
      keyVaultConnector.getSecret(config.COSMOS_CONNECTION_STRING_ID),
      keyVaultConnector.getSecret(config.TWILIO_ACCESS_KEY_ID),
      keyVaultConnector.getSecret(config.PHONE_HASH_SALT_ID),
    ])

    updatedConfig.STORAGE_ACCESS_KEY = storageSecret.value || ''
    updatedConfig.JWT_SIGN_KEY = jwtSecret.value || ''
    updatedConfig.COSMOS_CONNECTION_STRING = cosmosSecret.value || ''
    updatedConfig.TWILIO_ACCESS_KEY = twilioSecret.value || ''
    updatedConfig.PHONE_HASH_SALT = phoneSecret.value || ''
  }

  return updatedConfig
}
