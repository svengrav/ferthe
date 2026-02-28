import { z } from 'zod'
import { AccountContext } from './accounts.ts'
import { Result } from './results.ts'
import { guard } from './strings.ts'

export const DiscoveryProfileSchema = z.object({
  id: guard.idString,
  accountId: guard.idString,
  lastActiveTrailId: guard.idString.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type DiscoveryProfile = z.infer<typeof DiscoveryProfileSchema>

export const DiscoveryProfileUpdateDataSchema = z.object({
  lastActiveTrailId: guard.idString.optional(),
})

export type DiscoveryProfileUpdateData = z.infer<typeof DiscoveryProfileUpdateDataSchema>

export interface DiscoveryProfileActions {
  getProfile: (context: AccountContext) => Promise<Result<DiscoveryProfile>>
  updateProfile: (context: AccountContext, updateData: DiscoveryProfileUpdateData) => Promise<Result<DiscoveryProfile>>
}
