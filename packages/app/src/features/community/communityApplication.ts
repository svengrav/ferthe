import { getSession } from '@app/features/account'
import { logger } from '@app/shared/utils/logger'
import { Community, CommunityApplicationContract, CommunityMember, Discovery, Result, SharedDiscovery } from '@shared/contracts'
import { getCommunityActions } from './stores/communityStore'

export interface CommunityApplicationOptions {
  communityAPI: CommunityApplicationContract
}

export interface CommunityApplication {
  requestCommunities: () => Promise<void>
  createCommunity: (input: { name: string; trailIds: string[] }) => Promise<Result<Community>>
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
  const { communityAPI } = options

  const requestCommunities = async () => {
    const { setCommunities, setStatus } = getCommunityActions()
    setStatus('loading')

    try {
      const session = getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const result = await communityAPI.listCommunities(session)
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
      const session = getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const result = await communityAPI.createCommunity(session, input)
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

  const joinCommunity = async (inviteCode: string): Promise<Result<Community>> => {
    const { addCommunity } = getCommunityActions()

    try {
      const session = getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const result = await communityAPI.joinCommunity(session, inviteCode)
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
      const session = getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const result = await communityAPI.leaveCommunity(session, communityId)
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
      const session = getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const result = await communityAPI.removeCommunity(session, communityId)
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
      const session = getSession()
      if (!session) {
        throw new Error('No session found')
      }

      return await communityAPI.listCommunityMembers(session, communityId)
    } catch (error: unknown) {
      logger.error('Error getting community members:', error)
      return { success: false, error: { code: 'GET_MEMBERS_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }
    }
  }

  const shareDiscovery = async (discoveryId: string, communityId: string): Promise<Result<SharedDiscovery>> => {
    try {
      const session = getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const result = await communityAPI.shareDiscovery(session, discoveryId, communityId)
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
      const session = getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const result = await communityAPI.unshareDiscovery(session, discoveryId, communityId)
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
      const session = getSession()
      if (!session) {
        throw new Error('No session found')
      }

      return await communityAPI.getSharedDiscoveries(session, communityId)
    } catch (error: unknown) {
      logger.error('Error getting shared discoveries:', error)
      return { success: false, error: { code: 'GET_SHARED_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }
    }
  }

  return {
    requestCommunities,
    createCommunity,
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
