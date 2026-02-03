import { Community, CommunityMember, DiscoveryReaction, SharedDiscovery } from '@shared/contracts'
import { Store } from '../../store/storeFactory.ts'

export interface CommunityStore {
  communities: Store<Community>
  members: Store<CommunityMember>
  reactions: Store<DiscoveryReaction>
  discoveries: Store<SharedDiscovery>
}
