import { z } from 'zod'
import type { AccountContext } from './accounts.ts'
import type { QueryOptions, Result } from './results.ts'

export const AppUpdateSchema = z.object({
  id: z.string(),
  version: z.string(),
  createdAt: z.string(), // ISO-8601 timestamp
  latestAppVersion: z.string(),
  minAppVersion: z.string(),
  force: z.boolean(),
  message: z.string().optional(),
  patchNotes: z.array(z.string()).optional(),
  storeUrl: z.string().optional(),
})

export type AppUpdate = z.infer<typeof AppUpdateSchema>
export type AppUpdateInput = Omit<AppUpdate, 'id' | 'createdAt'>

export interface SystemApplicationContract {
  getAppUpdate(): Promise<Result<AppUpdate>>
  addAppUpdate(context: AccountContext, update: AppUpdateInput): Promise<Result<void>>
  listAppUpdates(context: AccountContext, options?: QueryOptions): Promise<Result<AppUpdate[]>>
}