import { z } from 'zod'
import { AccountContext } from './accounts.ts'
import { Result } from './results.ts'

export const DiscoveryProfileSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  lastActiveTrailId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type DiscoveryProfile = z.infer<typeof DiscoveryProfileSchema>

export const DiscoveryProfileUpdateDataSchema = z.object({
  lastActiveTrailId: z.string().optional(),
})

export type DiscoveryProfileUpdateData = z.infer<typeof DiscoveryProfileUpdateDataSchema>

export interface DiscoveryProfileActions {
  getProfile: (context: AccountContext) => Promise<Result<DiscoveryProfile>>
  updateProfile: (context: AccountContext, updateData: DiscoveryProfileUpdateData) => Promise<Result<DiscoveryProfile>>
}
