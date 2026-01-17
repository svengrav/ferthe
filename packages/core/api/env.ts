import * as dotenv from 'dotenv'
import { createEnvironmentConfig } from './config/environmentConfig.ts'
dotenv.config()

const IS_PRODUCTION = Deno.env.get('PRODUCTION')?.toLowerCase() === 'true'

export const getConfig = async () =>
  await createEnvironmentConfig({
    // Development Environment
    ENV_TYPE: IS_PRODUCTION ? 'production' : 'development',

    // STORE_TYPE: process.env.STORE_TYPE || 'memory', // Default store type for development
    STORE_TYPE: IS_PRODUCTION ? 'cosmos' : 'json',

    // API Configuration
    API_PORT: Deno.env.get('PORT') || '3000',
    API_HOST: Deno.env.get('HOST') || '0.0.0.0',
    API_PREFIX: '/core/api',
    ORIGINS: ['http://localhost:8081', 'http://localhost:3000', 'http://192.168.0.200:8081', 'https://ferthe.eu'],

    KEY_VAULT_NAME: 'kv-ferthe-core',

    TWILIO_ACCOUNT_SID: 'ACbc7e6616309b1343392a088525d4f7df',
    TWILIO_VERIFY_SERVICE_ID: 'VA0e3f1ea84078e623af55f01e0aa6bf85',

    // Database
    COSMOS_DATABASE_NAME: IS_PRODUCTION ? 'ferthe-core-prod-v1' : 'ferthe-core-dev-v1',
    JSON_STORE_BASE_DIRECTORY: '../../_data/core',

    STORAGE_ACCESS_KEY_ID: 'key-stferthecore',
    JWT_SIGN_KEY_ID: 'api-jwt-sign-key',
    COSMOS_CONNECTION_STRING_ID: 'cstr-cdb-ferthe-core',
    TWILIO_ACCESS_KEY_ID: 'key-twilio-phone-verify',
    PHONE_HASH_SALT_ID: 'api-phone-hash-salt-key',
  })
