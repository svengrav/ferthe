import { logger } from '@core/shared/logger.ts'
import { Store } from '@core/store/storeFactory.ts'
import { AppUpdate, AppUpdateInput, SystemApplicationContract } from '@shared/contracts/system.ts'
import { appUpdate as defaultAppUpdate } from '@core/api/manifest.ts'
import { QueryOptions, Result } from '@shared/contracts/results.ts'
import type { AccountContext } from '@shared/contracts/accounts.ts'
import { createDeterministicId } from "../../utils/idGenerator.ts";

export type SystemApplication = SystemApplicationContract

/**
 * Manages app update history.
 * Each new version creates a new document (update_<version>).
 * Falls back to manifest defaults if no updates are stored yet.
 */
export function createSystemApplication(appUpdatesStore: Store<AppUpdate>): SystemApplication {

  // Fetch the most recent app update, falls back to manifest default
  const getAppUpdate = async (): Promise<Result<AppUpdate>> => {
    try {
      const result = await appUpdatesStore.list({ sortBy: 'createdAt', sortOrder: 'desc', limit: 1 })
      return { success: true, data: result.data?.[0] ?? defaultAppUpdate }
    } catch (error) {
      logger.error('[SystemApplication] Failed to load latest app update:', error)
      return { success: true, data: defaultAppUpdate }
    }
  }

  // Persist a new app update record
  const saveAppUpdate = async (version: string, update: AppUpdateInput): Promise<void> => {
    const record: AppUpdate = {
      ...update,
      id: createDeterministicId(`app_${version}`),
      version,
      createdAt: new Date().toISOString(),
    }
    await appUpdatesStore.create(record)
    logger.info('[SystemApplication] App update recorded:', { id: record.id, version })
  }

  const addAppUpdate = async (context: AccountContext, update: AppUpdateInput): Promise<Result<void>> => {
    if (context.role !== 'admin') {
      return { success: false, error: { code: 'ADMIN_REQUIRED', message: 'Admin access required' } }
    }
    try {
      await saveAppUpdate(update.version, update)
      return { success: true }
    } catch (error) {
      logger.error('[SystemApplication] Failed to save app update:', error)
      return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to save app update' } }
    }
  }

  const listAppUpdates = async (_context: AccountContext, options?: QueryOptions): Promise<Result<AppUpdate[]>> => {
    try {
      const result = await appUpdatesStore.list({
        sortBy: options?.sortBy ?? 'createdAt',
        sortOrder: options?.sortOrder ?? 'desc',
        limit: options?.limit ?? 50,
      })
      return { success: true, data: result.data ?? [] }
    } catch (error) {
      logger.error('[SystemApplication] Failed to list app updates:', error)
      return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list app updates' } }
    }
  }

  return { getAppUpdate, addAppUpdate, listAppUpdates }
}
