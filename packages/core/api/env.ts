import * as dotenv from 'dotenv'
import { createEnvironmentConfig } from './config/environmentConfig.ts'
dotenv.config()

const IS_PRODUCTION = process.env.PRODUCTION?.toLowerCase() === 'true'

export const getConfig = async () =>
  createEnvironmentConfig({
    // Development Environment
    FERTHE_ENV: IS_PRODUCTION ? 'production' : 'development',

    // STORE_TYPE: process.env.STORE_TYPE || 'memory', // Default store type for development
    STORE_TYPE: IS_PRODUCTION ? 'cosmos' : 'json',

    // API Configuration
    API_PORT: process.env.PORT || '3000',
    API_HOST: process.env.HOST || '0.0.0.0',
    API_PREFIX: '/core/api',
    ORIGINS: ['http://localhost:8081', 'http://localhost:3000', 'https://ferthe.eu'],

    KEY_VAULT_NAME: 'kv-ferthe-core',

    // Database
    COSMOS_DATABASE_NAME: IS_PRODUCTION ? 'ferthe-core-prod-v1' : 'ferthe-core-dev-v1',
    JSON_STORE_BASE_DIRECTORY: '../../_data/core',

    STORAGE_ACCESS_KEY_ID: 'key-stferthecore',
    JWT_SIGN_KEY_ID: 'api-jwt-sign-key',
    COSMOS_CONNECTION_STRING_ID: 'cstr-cdb-ferthe-core',
    TWILIO_ACCESS_KEY_ID: 'key-twilio-phone-verify',
    PHONE_HASH_SALT_ID: 'api-phone-hash-salt-key',
  })
