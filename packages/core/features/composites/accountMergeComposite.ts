import { Store } from '@core/store/storeFactory.ts'
import { CommunityMember, Discovery, DiscoveryContent, DiscoveryProfile, StoredSpot } from '@shared/contracts/index.ts'

export interface AccountMergeCompositeOptions {
  discoveryStore: Store<Discovery>
  spotStore: Store<StoredSpot>
  communityMemberStore: Store<CommunityMember>
  discoveryContentStore: Store<DiscoveryContent>
  discoveryProfileStore: Store<DiscoveryProfile>
}

export interface AccountMergeComposite {
  merge: (localAccountId: string, phoneAccountId: string) => Promise<void>
}

/**
 * Migrates all domain data from a local (unverified) account into
 * an existing phone account. Called by accountApplication on upgrade
 * when the phone number is already registered.
 */
export function createAccountMergeComposite(options: AccountMergeCompositeOptions): AccountMergeComposite {
  const { discoveryStore, spotStore, communityMemberStore, discoveryContentStore, discoveryProfileStore } = options

  return {
    async merge(localAccountId, phoneAccountId) {
      const [discoveries, spots, members, contents, profiles] = await Promise.all([
        discoveryStore.list(),
        spotStore.list(),
        communityMemberStore.list(),
        discoveryContentStore.list(),
        discoveryProfileStore.list(),
      ])

      await Promise.all([
        ...(discoveries.data ?? []).filter(d => d.accountId === localAccountId)
          .map(d => discoveryStore.update(d.id, { ...d, accountId: phoneAccountId })),
        ...(spots.data ?? []).filter(s => s.createdBy === localAccountId)
          .map(s => spotStore.update(s.id!, { ...s, createdBy: phoneAccountId })),
        ...(members.data ?? []).filter(m => m.accountId === localAccountId)
          .map(m => communityMemberStore.update(m.id, { ...m, accountId: phoneAccountId })),
        ...(contents.data ?? []).filter(c => c.accountId === localAccountId)
          .map(c => discoveryContentStore.update(c.id, { ...c, accountId: phoneAccountId })),
        ...(profiles.data ?? []).filter(p => p.accountId === localAccountId)
          .map(p => discoveryProfileStore.delete(p.id)),
      ])
    },
  }
}
