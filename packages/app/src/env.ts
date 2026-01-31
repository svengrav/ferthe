// Expo/React Native environment detection
const IS_PRODUCTION = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production'

/**
 * App environment configuration
 * All values derived from process.env at build time
 */
export const ENV = {
  // Environment
  isProduction: IS_PRODUCTION,
  isDevelopment: !IS_PRODUCTION,

  // API
  apiEndpoint: IS_PRODUCTION ? 'https://foxhole.ferthe.eu/core/api/v1' : 'http://localhost:3000/core/api/v1',
  apiTimeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '5000'),

  // Storage
  storeType: (IS_PRODUCTION ? 'secure' : 'json') as 'secure' | 'json',
  jsonStoreUrl: IS_PRODUCTION ? undefined : 'http://localhost:3010',

  // Debug Features
  enableLogger: !IS_PRODUCTION,
  enableMapDebug: true  //process.env.EXPO_PUBLIC_MAP_DEBUG === 'true' || !IS_PRODUCTION,
}
