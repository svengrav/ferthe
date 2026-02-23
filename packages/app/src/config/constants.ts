import { Platform } from 'react-native'

export type AppConfig = ReturnType<typeof createAppConfig>

type Environment = 'production' | 'development'
type StoreType = 'secure' | 'json'

export function createAppConfig() {
  const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production'
  const isWeb = Platform.OS === 'web'

  return {
    environment: (isProduction ? 'production' : 'development') as Environment,

    api: {
      endpoint: process.env.EXPO_PUBLIC_API_URL || 'https://foxhole.ferthe.eu/core/api/v1',
      timeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '5000'),
    },

    storage: {
      // Web always uses json, mobile uses secure in production
      type: (isWeb ? 'json' : (isProduction ? 'secure' : 'json')) as StoreType,
      jsonStoreUrl: process.env.EXPO_PUBLIC_JSON_STORE_URL,
    },

    debug: {
      enableLogger: process.env.EXPO_PUBLIC_ENABLE_LOGGER === 'true',
      enableMapDebug: process.env.EXPO_PUBLIC_MAP_DEBUG === 'true',
    },
  }
}
