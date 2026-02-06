import { getAppContext } from '@app/appContext'
import AccountView from '@app/features/account/components/AccountView'
import { useAccountData } from '@app/features/account/stores/accountStore'
import { useTrails } from '@app/features/trail/stores/trailStore'
import { Avatar, Button, Page, Stack } from '@app/shared/components'
import { Header } from '@app/shared/components/'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { setOverlay, useOverlayStore } from '@app/shared/overlay'
import { useCallback, useEffect, useState } from 'react'
import { useCommunityData, useCommunityStatus } from '../stores/communityStore'
import CommunityCreator from './CommunityCreator'
import { JoinCommunitySection } from './JoinCommunitySection'
import { MyCommunitiesSection } from './MyCommunitiesSection'

const INVITE_CODE_LENGTH = 6
const AVATAR_SIZE = 80

/**
 * Hook for managing communities screen logic including creating, joining, and refreshing communities.
 */
const useCommunitiesScreen = () => {
  const { communities } = useCommunityData()
  const status = useCommunityStatus()
  const trails = useTrails()
  const { communityApplication } = getAppContext()

  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  // Initialize communities on mount
  useEffect(() => {
    if (status === 'uninitialized') {
      communityApplication.requestCommunities()
    }
  }, [status, communityApplication])

  const handleCreateCommunity = useCallback(async (data: { name: string; trailId: string }) => {
    setIsCreating(true)
    const result = await communityApplication.createCommunity({ name: data.name.trim(), trailIds: [data.trailId] })
    setIsCreating(false)

    if (result.success) {
      useOverlayStore.getState().removeByKey('createCommunity')
    }
  }, [communityApplication])

  const handleJoinCommunity = useCallback(async (code: string) => {
    if (!code.trim()) return

    setIsJoining(true)
    const result = await communityApplication.joinCommunity(code.trim().toUpperCase())
    setIsJoining(false)

    if (result.success) {
      useOverlayStore.getState().removeByKey('joinCommunity')
    }
  }, [communityApplication])

  const handleRefresh = useCallback(() => {
    communityApplication.requestCommunities()
  }, [communityApplication])

  return {
    communities,
    trails,
    isLoading: status === 'loading',
    isCreating,
    isJoining,
    handleCreateCommunity,
    handleJoinCommunity,
    handleRefresh,
  }
}

/**
 * Screen for managing communities: creating new communities, joining with invite codes, and viewing existing communities.
 */
function CommunitiesScreen() {
  const { t } = useLocalizationStore()
  const { account } = useAccountData()
  const {
    communities,
    trails,
    isLoading,
    isJoining,
    handleCreateCommunity,
    handleJoinCommunity,
    handleRefresh,
  } = useCommunitiesScreen()

  // Open overlay to create a new community
  const handleOpenCreateOverlay = () => {
    setOverlay(
      'createCommunity',
      <CommunityCreator
        trails={trails}
        onCreate={handleCreateCommunity}
      />,
      {
        variant: 'compact',
      }
    )
  }

  // Open overlay to join an existing community
  const handleOpenJoinOverlay = () => {
    setOverlay(
      'joinCommunity',
      <JoinCommunitySection
        onJoin={handleJoinCommunity}
        disabled={isJoining}
        maxLength={INVITE_CODE_LENGTH}
      />,
      {
        variant: 'compact',
      }
    )
  }

  // Open account view overlay
  const handleOpenAccountOverlay = () => {
    setOverlay('accountView', <AccountView />)
  }

  const displayName = account?.displayName || t.community.defaultName
  const greeting = `${t.community.greeting}, ${displayName}`

  return (
    <Page action={<Button icon="person" onPress={handleOpenAccountOverlay} />} scrollable>
      <Stack>
        <Header title={greeting} />
        <Avatar size={AVATAR_SIZE} avatar={account?.avatar} label={account?.displayName} />
        <Header title={t.community.communities} />
        <MyCommunitiesSection
          communities={communities}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          onCreatePress={handleOpenCreateOverlay}
          onJoinPress={handleOpenJoinOverlay}
        />
      </Stack>
    </Page>
  )
}

export default CommunitiesScreen
