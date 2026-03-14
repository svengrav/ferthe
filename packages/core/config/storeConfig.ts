import { COSMOS_CONFIG, JSON_CONFIG, POSTGRES_CONFIG, TABLE_CONFIG } from '@core/store/storeFactory.ts'
import type { Config } from './index.ts'

/**
 * Creates store configuration based on store type
 */
export function createStoreConfig(config: Config): COSMOS_CONFIG | JSON_CONFIG | TABLE_CONFIG | POSTGRES_CONFIG | undefined {
  const { secrets, constants } = config

  switch (constants.store.type) {
    case 'cosmos':
      return {
        connectionString: secrets.azure.cosmosConnectionString,
        database: constants.store.cosmosDatabase,
      }
    case 'table':
      return {
        connectionString: secrets.azure.tableConnectionString,
      }
    case 'postgres':
      if (!secrets.supabase) {
        throw new Error('Supabase credentials missing in _config.json')
      }
      return {
        supabaseUrl: secrets.supabase.url,
        supabaseKey: secrets.supabase.key,
      }
    case 'json':
      return {
        baseDirectory: constants.store.jsonBaseDirectory,
      }
    default:
      return undefined
  }
}
