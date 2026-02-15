import { Status, StoreActions, StoreData } from '@app/shared/index'
import { Community, CommunityMember } from '@shared/contracts'
import { create } from 'zustand'

interface CommunityData extends StoreData {
  communities: Community[]
  members: CommunityMember[]
  activeCommunityId?: string
  status: Status
}

interface CommunityActions extends StoreActions {
  setCommunities: (communities: Community[]) => void
  setMembers: (members: CommunityMember[]) => void
  setActiveCommunity: (communityId: string | undefined) => void
  addCommunity: (community: Community) => void
  removeCommunity: (communityId: string) => void
}

export const communityStore = create<CommunityData & CommunityActions>(set => ({
  // Metadata
  updatedAt: new Date(0),
  status: 'uninitialized',
  error: undefined,

  // Community specific data
  communities: [],
  members: [],
  activeCommunityId: undefined,

  // Actions
  setStatus: status => set({ status }),
  setCommunities: communities => set({ communities, updatedAt: new Date(), status: 'ready' }),
  setMembers: members => set({ members }),
  setActiveCommunity: activeCommunityId => set({ activeCommunityId }),
  addCommunity: community =>
    set(state => ({
      communities: [...state.communities, community],
      updatedAt: new Date(),
    })),
  removeCommunity: communityId =>
    set(state => ({
      communities: state.communities.filter(c => c.id !== communityId),
      updatedAt: new Date(),
    })),
}))

export const useCommunityData = () => communityStore(state => state)
export const useCommunities = () => communityStore(state => state.communities)
export const useCommunityMembers = () => communityStore(state => state.members)
export const useCommunityStatus = () => communityStore(state => state.status)
export const useActiveCommunityId = () => communityStore(state => state.activeCommunityId)

export const getCommunityData = () => ({
  communities: communityStore.getState().communities,
  members: communityStore.getState().members,
})

export const getCommunityActions = () => ({
  setCommunities: communityStore.getState().setCommunities,
  setMembers: communityStore.getState().setMembers,
  setActiveCommunity: communityStore.getState().setActiveCommunity,
  addCommunity: communityStore.getState().addCommunity,
  removeCommunity: communityStore.getState().removeCommunity,
  setStatus: communityStore.getState().setStatus,
})
