import { Store } from '@core/store/storeFactory.ts'
import { CommunityMember, Discovery, DiscoveryProfile, Story, StoredSpot } from '@shared/contracts/index.ts'

export interface AccountMergeCompositeOptions {
  discoveryStore: Store<Discovery>
  spotStore: Store<StoredSpot>
  communityMemberStore: Store<CommunityMember>
  storyStore: Store<Story>
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
  const { discoveryStore, spotStore, communityMemberStore, storyStore, discoveryProfileStore } = options

  return {
    async merge(localAccountId, phoneAccountId) {
      const [discoveries, spots, members, stories, profiles] = await Promise.all([
        discoveryStore.list(),
        spotStore.list(),
        communityMemberStore.list(),
        storyStore.list(),
        discoveryProfileStore.list(),
      ])

      await Promise.all([
        ...(discoveries.data ?? []).filter(d => d.accountId === localAccountId)
          .map(d => discoveryStore.update(d.id, { ...d, accountId: phoneAccountId })),
        ...(spots.data ?? []).filter(s => s.createdBy === localAccountId)
          .map(s => spotStore.update(s.id!, { ...s, createdBy: phoneAccountId })),
        ...(members.data ?? []).filter(m => m.accountId === localAccountId)
          .map(m => communityMemberStore.update(m.id, { ...m, accountId: phoneAccountId })),
        ...(stories.data ?? []).filter(s => s.accountId === localAccountId)
          .map(s => storyStore.update(s.id, { ...s, accountId: phoneAccountId })),
        ...(profiles.data ?? []).filter(p => p.accountId === localAccountId)
          .map(p => discoveryProfileStore.delete(p.id)),
      ])
    },
  }
}
