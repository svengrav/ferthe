export type Constants = ReturnType<typeof createConstants>

type ProductionType = 'production' | 'development'
type StoreType = 'cosmos' | 'json' | 'memory' | 'table'

export function createConstants() {
  const isProduction = Deno.env.get('PRODUCTION')?.toLowerCase() === 'true'

  return {
    environment: isProduction ? 'production' : 'development' as ProductionType,
    api: {
      host: Deno.env.get('HOST') || '0.0.0.0',
      port: Number(Deno.env.get('PORT')) || 7000,
      prefix: '/api',
      origins: ['http://localhost:8081', 'http://localhost:7000', 'https://ferthe.de'],
    },
    store: {
      type: isProduction ? 'table' : 'json' as StoreType,
      cosmosDatabase: isProduction ? 'ferthe-core-prod-v1' : 'ferthe-core-dev-v1',
      jsonBaseDirectory: '../../_data/core',
    },
    storage: {
      containerName: 'resources',
      sasExpiryMinutes: 60 * 24 * 7,
    },
    images: {
      maxSizeBytes: 3 * 1024 * 1024,
    },
    content: {
      dir: Deno.env.get('CONTENT_DIR') ?? '../web/content',
    },
  }
}

/**
 * Store IDs for different data collections.
 */
export const STORE_IDS = {
  TRAILS: 'trail-collection',
  SPOTS: 'spot-collection',
  TRAIL_SPOTS: 'trail-spot-relations',
  ACCOUNTS: 'account-collection',
  ACCOUNT_SESSIONS: 'account-sessions',
  ACCOUNT_SMS_CODES: 'account-sms-codes',
  DISCOVERIES: 'discovery-collection',
  DISCOVERY_PROFILES: 'discovery-profile-collection',
  DISCOVERY_CONTENTS: 'discovery-content-collection',
  STORIES: 'story-collection',
  SPOT_RATINGS: 'spot-ratings',
  TRAIL_RATINGS: 'trail-ratings',
  SENSOR_SCANS: 'sensor-scans',
  COMMUNITIES: 'community-collection',
  COMMUNITY_MEMBERS: 'community-members',
  COMMUNITY_DISCOVERIES: 'community-discoveries',
  DEVICE_TOKENS: 'device-tokens',
  STUMBLE_POIS: 'stumble-pois',
  STUMBLE_VISITS: 'stumble-visits',
} as const
