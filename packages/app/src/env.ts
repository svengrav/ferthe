import { createAppEnvironmentConfig } from './config/environmentConfig'

// Expo/React Native environment detection
const IS_PRODUCTION = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production'

// const IS_PRODUCTION = true // Force development mode for testing purposes

export const getAppConfig = () =>
  createAppEnvironmentConfig({
    // Environment
    ENV_TYPE: IS_PRODUCTION ? 'production' : 'development',

    // API Configuration
    API_ENDPOINT: IS_PRODUCTION ? 'https://foxhole.ferthe.eu/core/api/v1' : 'http://localhost:3000/core/api/v1',
    API_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '5000'),

    // Storage Configuration
    STORE_TYPE: IS_PRODUCTION ? 'secure' : 'json',
    JSON_STORE_BASE_DIRECTORY: '../_data/app', // dev only, secure in production
    JSON_STORE_SERVER_URL: IS_PRODUCTION ? undefined : 'http://localhost:3010',

    // Features
    ENABLE_LOGGER: !IS_PRODUCTION,
    ENABLE_ANALYTICS: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true' || IS_PRODUCTION,
    ENABLE_DEBUG_LOGS: process.env.EXPO_PUBLIC_ENABLE_DEBUG_LOGS === 'true' || !IS_PRODUCTION,
  })
