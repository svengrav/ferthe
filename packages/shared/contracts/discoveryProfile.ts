import { AccountContext } from './accounts.ts'
import { Result } from './results.ts'

export interface DiscoveryProfile {
  id: string // This will be the accountId for easy lookup
  accountId: string
  lastActiveTrailId?: string
  createdAt: Date
  updatedAt: Date
}

export interface DiscoveryProfileUpdateData {
  lastActiveTrailId?: string
}

export interface DiscoveryProfileActions {
  getProfile: (context: AccountContext) => Promise<Result<DiscoveryProfile>>
  updateProfile: (context: AccountContext, updateData: DiscoveryProfileUpdateData) => Promise<Result<DiscoveryProfile>>
}
