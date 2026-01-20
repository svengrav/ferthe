import { getSession } from '@app/features/account'
import { logger } from '@app/shared/utils/logger'
import { Community, CommunityApplicationContract, CommunityMember, Result } from '@shared/contracts'
import { getCommunityActions } from './stores/communityStore'

export interface CommunityApplicationOptions {
  createCommunity: CommunityApplicationContract['createCommunity']
  joinCommunity: CommunityApplicationContract['joinCommunity']
  leaveCommunity: CommunityApplicationContract['leaveCommunity']
  getCommunity: CommunityApplicationContract['getCommunity']
  listCommunities: CommunityApplicationContract['listCommunities']
  listCommunityMembers: CommunityApplicationContract['listCommunityMembers']
}

export interface CommunityApplication {
  requestCommunities: () => Promise<void>
  createCommunity: (name: string) => Promise<Result<Community>>
  joinCommunity: (inviteCode: string) => Promise<Result<Community>>
  leaveCommunity: (communityId: string) => Promise<Result<void>>
  setActiveCommunity: (communityId: string | undefined) => void
  getCommunityMembers: (communityId: string) => Promise<Result<CommunityMember[]>>
}

export function createCommunityApplication(options: CommunityApplicationOptions): CommunityApplication {
  const {
    createCommunity: createCommunityAPI,
    joinCommunity: joinCommunityAPI,
    leaveCommunity: leaveCommunityAPI,
    listCommunities: listCommunitiesAPI,
    listCommunityMembers: listCommunityMembersAPI,
  } = options

  const requestCommunities = async () => {
    const { setCommunities, setStatus } = getCommunityActions()
    setStatus('loading')

    try {
      const session = getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const result = await listCommunitiesAPI(session)
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

  const createCommunity = async (name: string): Promise<Result<Community>> => {
    const { addCommunity } = getCommunityActions()

    try {
      const session = getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const result = await createCommunityAPI(session, name)
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

      const result = await joinCommunityAPI(session, inviteCode)
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
    const { removeCommunity } = getCommunityActions()

    try {
      const session = getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const result = await leaveCommunityAPI(session, communityId)
      if (result.success) {
        removeCommunity(communityId)
        logger.log(`Left community: ${communityId}`)
      }

      return result
    } catch (error: any) {
      logger.error('Error leaving community:', error)
      return { success: false, error: { code: 'LEAVE_ERROR', message: error.message } }
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

      return await listCommunityMembersAPI(session, communityId)
    } catch (error: unknown) {
      logger.error('Error getting community members:', error)
      return { success: false, error: { code: 'GET_MEMBERS_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } }
    }
  }

  return {
    requestCommunities,
    createCommunity,
    joinCommunity,
    leaveCommunity,
    setActiveCommunity,
    getCommunityMembers,
  }
}
