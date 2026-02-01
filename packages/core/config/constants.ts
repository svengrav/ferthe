export type Constants = ReturnType<typeof createConstants>

type ProductionType = 'production' | 'development'
type StoreType = 'cosmos' | 'json' | 'memory'

export function createConstants() {
  const isProduction = Deno.env.get('PRODUCTION')?.toLowerCase() === 'true'

  return {
    environment: isProduction ? 'production' : 'development' as ProductionType,
    api: {
      host: Deno.env.get('HOST') || '0.0.0.0',
      port: Number(Deno.env.get('PORT')) || 3000,
      prefix: '/core/api',
      origins: ['http://localhost:8081', 'http://localhost:3000', 'https://ferthe.eu'],
    },
    store: {
      type: isProduction ? 'cosmos' : 'json' as StoreType,
      cosmosDatabase: isProduction ? 'ferthe-core-prod-v1' : 'ferthe-core-dev-v1',
      jsonBaseDirectory: '../../_data/core',
    },
    twilio: {
      accountSid: Deno.env.get('TWILIO_ACCOUNT_SID') || 'ACbc7e6616309b1343392a088525d4f7df',
      verifyServiceId: Deno.env.get('TWILIO_VERIFY_SERVICE_SID') || 'VA0e3f1ea84078e623af55f01e0aa6bf85',
    },
    storage: {
      containerName: 'images',
      sasExpiryMinutes: 15,
    },
  }
}

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
  DISCOVERY_REACTIONS: 'discovery-reactions',
  SENSOR_SCANS: 'sensor-scans',
  COMMUNITIES: 'community-collection',
  COMMUNITY_MEMBERS: 'community-members',
} as const
