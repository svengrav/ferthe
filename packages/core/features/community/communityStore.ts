import { Community, CommunityMember, SharedDiscovery, SpotRating } from '@shared/contracts'
import { Store } from '../../store/storeFactory.ts'

export interface CommunityStore {
  communities: Store<Community>
  members: Store<CommunityMember>
  ratings: Store<SpotRating>
  discoveries: Store<SharedDiscovery>
}
