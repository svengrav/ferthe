export type Constants = ReturnType<typeof createConstants>

type ProductionType = 'production' | 'development'
type StoreType = 'cosmos' | 'json' | 'memory' | 'table' | 'postgres'

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
      type: (Deno.env.get('STORE_TYPE') || (isProduction ? 'table' : 'json')) as StoreType,
      cosmosDatabase: isProduction ? 'ferthe-core-prod-v1' : 'ferthe-core-dev-v1',
      jsonBaseDirectory: '../../_data/core',
      supabaseUrl: Deno.env.get('SUPABASE_URL'),
      supabaseKey: Deno.env.get('SUPABASE_KEY'),
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
    system: {
      defaultDiscoveryTrailId: 'stx4j9k2n000101mh8d4k9n2q',
      welcomeSpot: {
        imageBlobPath: '06r5e44o2rlelaqybh0b.webp',
        blurredImageBlobPath: '06r5e44o2rlelaqybh0b-blurred.webp',
      },
    },
    stumble: {
      maxSuggestions: 5,
      defaultRadiusMeters: 1000,
    },
  }
}

/**
 * Store IDs for different data collections.
 */
export const STORE_IDS = {
  TRAILS: 'trails',
  SPOTS: 'spots',
  TRAIL_SPOTS: 'trail_spots',
  ACCOUNTS: 'accounts',
  ACCOUNT_SESSIONS: 'account_sessions',
  ACCOUNT_SMS_CODES: 'account_sms_codes',
  DISCOVERIES: 'discoveries',
  DISCOVERY_PROFILES: 'discovery_profiles',
  STORIES: 'stories',
  SPOT_RATINGS: 'spot_ratings',
  TRAIL_RATINGS: 'trail_ratings',
  SENSOR_SCANS: 'sensor_scans',
  COMMUNITIES: 'communities',
  COMMUNITY_MEMBERS: 'community_members',
  COMMUNITY_DISCOVERIES: 'community_discoveries',
  DEVICE_TOKENS: 'device_tokens',
  STUMBLE_POIS: 'stumble_pois',
  STUMBLE_VISITS: 'stumble_visits',
  STUMBLE_FEEDBACK: 'stumble_feedback',
} as const
