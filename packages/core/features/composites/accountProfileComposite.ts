import {
  AccountApplicationContract,
  AccountContext,
  AccountProfileCompositeContract,
  AccountPublicProfile,
  Result,
  SpotApplicationContract,
  SpotPreview,
  Trail,
  TrailApplicationContract,
} from '@shared/contracts/index.ts'

export interface AccountProfileCompositeOptions {
  accountApplication: AccountApplicationContract
  spotApplication: SpotApplicationContract
  trailApplication: TrailApplicationContract
}

/**
 * Assembles an account's public profile by combining account data
 * with spot count from the spot domain.
 */
export function createAccountProfileComposite(options: AccountProfileCompositeOptions): AccountProfileCompositeContract {
  const { accountApplication, spotApplication, trailApplication } = options

  const assembleProfile = async (
    context: AccountContext,
    accountId: string,
    allSpots: { createdBy?: string; id: string }[],
    allSpotPreviews: SpotPreview[],
    allTrails: Trail[],
  ): Promise<Result<AccountPublicProfile>> => {
    const profileResult = await accountApplication.getPublicProfile(context, accountId)
    if (!profileResult.success) return profileResult

    const userSpots = allSpots.filter(s => s.createdBy === accountId)
    const userSpotIds = new Set(userSpots.map(s => s.id))
    const userSpotPreviews = allSpotPreviews.filter(p => userSpotIds.has(p.id))

    const ratingCount = userSpotPreviews.reduce((sum, p) => sum + p.rating.count, 0)
    const avgRating = ratingCount > 0
      ? userSpotPreviews.reduce((sum, p) => sum + p.rating.average * p.rating.count, 0) / ratingCount
      : 0

    const trailCount = allTrails.filter(t => t.createdBy === accountId).length

    return {
      success: true,
      data: {
        ...profileResult.data!,
        spotCount: userSpots.length,
        trailCount,
        avgRating: Math.round(avgRating * 10) / 10,
        ratingCount,
      },
    }
  }

  return {
    async getPublicProfile(context: AccountContext, accountId: string): Promise<Result<AccountPublicProfile>> {
      const [spotsResult, previewsResult, trailsResult] = await Promise.all([
        spotApplication.getSpots(context),
        spotApplication.getSpotPreviews(),
        trailApplication.listTrails(context),
      ])
      return assembleProfile(context, accountId, spotsResult.data ?? [], previewsResult.data ?? [], trailsResult.data ?? [])
    },

    async getPublicProfiles(context: AccountContext, accountIds: string[]): Promise<Result<AccountPublicProfile[]>> {
      const [spotsResult, previewsResult, trailsResult] = await Promise.all([
        spotApplication.getSpots(context),
        spotApplication.getSpotPreviews(),
        trailApplication.listTrails(context),
      ])
      const allSpots = spotsResult.data ?? []
      const allSpotPreviews = previewsResult.data ?? []
      const allTrails = trailsResult.data ?? []
      const profiles = await Promise.all(accountIds.map(id => assembleProfile(context, id, allSpots, allSpotPreviews, allTrails)))
      const failed = profiles.find(r => !r.success)
      if (failed) return failed as unknown as Result<AccountPublicProfile[]>
      return { success: true, data: profiles.map(r => r.data!) }
    },
  }
}
