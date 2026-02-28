import { logger } from '@app/shared/utils/logger'
import { Community, CommunityMember, Discovery, Result, SharedDiscovery } from '@shared/contracts'
import type { ApiClient } from '@shared/orpc'
import { getCommunityActions } from './stores/communityStore'

export interface CommunityApplicationOptions {
  api: ApiClient
}

export interface CommunityApplication {
  requestCommunities: () => Promise<void>
  createCommunity: (input: { name: string; trailIds: string[] }) => Promise<Result<Community>>
  updateCommunity: (communityId: string, input: { name: string; trailIds: string[] }) => Promise<Result<Community>>
  joinCommunity: (inviteCode: string) => Promise<Result<Community>>
  leaveCommunity: (communityId: string) => Promise<Result<void>>
  removeCommunity: (communityId: string) => Promise<Result<void>>
  setActiveCommunity: (communityId: string | undefined) => void
  getCommunityMembers: (communityId: string) => Promise<Result<CommunityMember[]>>
  shareDiscovery: (discoveryId: string, communityId: string) => Promise<Result<SharedDiscovery>>
  unshareDiscovery: (discoveryId: string, communityId: string) => Promise<Result<void>>
  getSharedDiscoveries: (communityId: string) => Promise<Result<Discovery[]>>
}

export function createCommunityApplication(options: CommunityApplicationOptions): CommunityApplication {
  const { api } = options

  const requestCommunities = async () => {
    const { setCommunities, setStatus } = getCommunityActions()
    setStatus('loading')

    try {
      const result = await api.community.list()
      if (result.success && result.data) {
        setCommunities(result.data)
        logger.log(`Communities loaded: ${result.data.length}`)
      } else {
        setStatus('error')
        logger.error('Failed to load communities:', result.error)
      }
    } catch (error) {
      setStatus('error')
      logger.error('Error requesting communities:', error)
    }
  }

  const createCommunity = async (input: { name: string; trailIds: string[] }): Promise<Result<Community>> => {
    const { addCommunity } = getCommunityActions()

    try {
      const result = await api.community.create(input.name, input.trailIds)
      if (result.success && result.data) {
        addCommunity(result.data)
        logger.log(`Community created: ${result.data.name}`)
      }
      return result
    } catch (error: any) {
      logger.error('Error creating community:', error)
      return { success: false, error: { code: 'CREATE_ERROR', message: error.message } }
    }
  }

  const updateCommunity = async (communityId: string, input: { name: string; trailIds: string[] }): Promise<Result<Community>> => {
    const { replaceCommunity } = getCommunityActions()

    try {
      const result = await api.community.update(communityId, input)
      if (result.success && result.data) {
        replaceCommunity(result.data)
        logger.log(`Community updated: ${result.data.name}`)
      }
      return result
    } catch (error: any) {
      logger.error('Error updating community:', error)
      return { success: false, error: { code: 'UPDATE_COMMUNITY_ERROR', message: error.message } }
    }
  }

  const joinCommunity = async (inviteCode: string): Promise<Result<Community>> => {
    const { addCommunity } = getCommunityActions()

    try {
      const result = await api.community.join(inviteCode)
      if (result.success && result.data) {
        addCommunity(result.data)
        logger.log(`Joined community: ${result.data.name}`)
      }
      return result
    } catch (error: any) {
      logger.error('Error joining community:', error)
      return { success: false, error: { code: 'JOIN_ERROR', message: error.message } }
    }
  }

  const leaveCommunity = async (communityId: string): Promise<Result<void>> => {
    const { removeCommunity: removeFromStore } = getCommunityActions()

    try {
      const result = await api.community.leave(communityId)
      if (result.success) {
        removeFromStore(communityId)
        logger.log(`Left community: ${communityId}`)
      }
      return result
    } catch (error: any) {
      logger.error('Error leaving community:', error)
      return { success: false, error: { code: 'LEAVE_ERROR', message: error.message } }
    }
  }

  const removeCommunity = async (communityId: string): Promise<Result<void>> => {
    const { removeCommunity: removeFromStore } = getCommunityActions()

    try {
      const result = await api.community.delete(communityId)
      if (result.success) {
        removeFromStore(communityId)
        logger.log(`Removed community: ${communityId}`)
      }
      return result
    } catch (error: any) {
      logger.error('Error removing community:', error)
      return { success: false, error: { code: 'REMOVE_ERROR', message: error.message } }
    }
  }

  const setActiveCommunity = (communityId: string | undefined) => {
    const { setActiveCommunity: setActive } = getCommunityActions()
    setActive(communityId)
    logger.log(`Active community set: ${communityId || 'none'}`)
  }

  const getCommunityMembers = async (communityId: string): Promise<Result<CommunityMember[]>> => {
    try {
      return await api.community.listMembers(communityId)
    } catch (error: unknown) {
      logger.error('Error getting community members:', error)
      return { success: false, error: { code: 'GET_MEMBERS_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }
    }
  }

  const shareDiscovery = async (discoveryId: string, communityId: string): Promise<Result<SharedDiscovery>> => {
    try {
      const result = await api.community.shareDiscovery(communityId, discoveryId)
      if (result.success) {
        logger.log(`Discovery ${discoveryId} shared to community ${communityId}`)
      }
      return result
    } catch (error: unknown) {
      logger.error('Error sharing discovery:', error)
      return { success: false, error: { code: 'SHARE_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }
    }
  }

  const unshareDiscovery = async (discoveryId: string, communityId: string): Promise<Result<void>> => {
    try {
      const result = await api.community.unshareDiscovery(communityId, discoveryId)
      if (result.success) {
        logger.log(`Discovery ${discoveryId} unshared from community ${communityId}`)
      }
      return result
    } catch (error: unknown) {
      logger.error('Error unsharing discovery:', error)
      return { success: false, error: { code: 'UNSHARE_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }
    }
  }

  const getSharedDiscoveries = async (communityId: string): Promise<Result<Discovery[]>> => {
    try {
      return await api.community.listSharedDiscoveries(communityId)
    } catch (error: unknown) {
      logger.error('Error getting shared discoveries:', error)
      return { success: false, error: { code: 'GET_SHARED_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }
    }
  }

  return {
    requestCommunities,
    createCommunity,
    updateCommunity,
    joinCommunity,
    leaveCommunity,
    removeCommunity,
    setActiveCommunity,
    getCommunityMembers,
    shareDiscovery,
    unshareDiscovery,
    getSharedDiscoveries,
  }
}
