import {
  AccountApplicationContract,
  AccountContext,
  AccountProfileCompositeContract,
  AccountPublicProfile,
  Result,
  SpotApplicationContract,
} from '@shared/contracts/index.ts'

export interface AccountProfileCompositeOptions {
  accountApplication: AccountApplicationContract
  spotApplication: SpotApplicationContract
}

/**
 * Assembles an account's public profile by combining account data
 * with spot count from the spot domain.
 */
export function createAccountProfileComposite(options: AccountProfileCompositeOptions): AccountProfileCompositeContract {
  const { accountApplication, spotApplication } = options

  const assembleProfile = async (
    context: AccountContext,
    accountId: string,
    allSpots: { createdBy?: string }[],
  ): Promise<Result<AccountPublicProfile>> => {
    const profileResult = await accountApplication.getPublicProfile(context, accountId)
    if (!profileResult.success) return profileResult
    const spotCount = allSpots.filter(s => s.createdBy === accountId).length
    return { success: true, data: { ...profileResult.data!, spotCount } }
  }

  return {
    async getPublicProfile(context: AccountContext, accountId: string): Promise<Result<AccountPublicProfile>> {
      const spotsResult = await spotApplication.getSpots(context)
      return assembleProfile(context, accountId, spotsResult.data ?? [])
    },

    async getPublicProfiles(context: AccountContext, accountIds: string[]): Promise<Result<AccountPublicProfile[]>> {
      const spotsResult = await spotApplication.getSpots(context)
      const allSpots = spotsResult.data ?? []
      const profiles = await Promise.all(accountIds.map(id => assembleProfile(context, id, allSpots)))
      const failed = profiles.find(r => !r.success)
      if (failed) return failed as unknown as Result<AccountPublicProfile[]>
      return { success: true, data: profiles.map(r => r.data!) }
    },
  }
}
