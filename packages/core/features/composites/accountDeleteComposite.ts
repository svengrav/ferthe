import { Store } from '@core/store/storeFactory.ts'
import { CommunityMember, Discovery, DiscoveryContent, DiscoveryProfile, StoredSpot } from '@shared/contracts/index.ts'

interface AccountDeleteCompositeOptions {
  discoveryStore: Store<Discovery>
  spotStore: Store<StoredSpot>
  communityMemberStore: Store<CommunityMember>
  discoveryContentStore: Store<DiscoveryContent>
  discoveryProfileStore: Store<DiscoveryProfile>
}

export interface AccountDeleteComposite {
  delete: (accountId: string) => Promise<void>
}

/**
 * Removes all domain data belonging to an account across features.
 * Called by accountApplication.deleteAccount before removing the account record.
 */
export function createAccountDeleteComposite(options: AccountDeleteCompositeOptions): AccountDeleteComposite {
  const { discoveryStore, spotStore, communityMemberStore, discoveryContentStore, discoveryProfileStore } = options

  return {
    async delete(accountId) {
      const [discoveries, spots, members, contents, profiles] = await Promise.all([
        discoveryStore.list(),
        spotStore.list(),
        communityMemberStore.list(),
        discoveryContentStore.list(),
        discoveryProfileStore.list(),
      ])

      await Promise.all([
        ...(discoveries.data ?? []).filter(d => d.accountId === accountId).map(d => discoveryStore.delete(d.id)),
        ...(spots.data ?? []).filter(s => s.createdBy === accountId).map(s => spotStore.delete(s.id!)),
        ...(members.data ?? []).filter(m => m.accountId === accountId).map(m => communityMemberStore.delete(m.id)),
        ...(contents.data ?? []).filter(c => c.accountId === accountId).map(c => discoveryContentStore.delete(c.id)),
        ...(profiles.data ?? []).filter(p => p.accountId === accountId).map(p => discoveryProfileStore.delete(p.id)),
      ])
    },
  }
}
