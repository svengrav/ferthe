import { getAppContext } from '@app/appContext'
import AccountView from '@app/features/account/components/AccountView'
import { useAccountData } from '@app/features/account/stores/accountStore'
import { Avatar, Button, Page, Stack } from '@app/shared/components'
import { Header } from '@app/shared/components/'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { setOverlay, useOverlayStore } from '@app/shared/overlay'
import { useCallback, useEffect, useState } from 'react'
import { useCommunityCreator } from '../hooks/useCommunityCreator'
import { useCommunityData, useCommunityStatus } from '../stores/communityStore'
import { CommunityJoin } from './CommunityJoin'
import { CommunityList } from './CommunityList'

const INVITE_CODE_LENGTH = 6
const AVATAR_SIZE = 80

/**
 * Hook for managing communities screen logic including creating, joining, and refreshing communities.
 */
const useCommunitiesScreen = () => {
  const { communities } = useCommunityData()
  const status = useCommunityStatus()
  const { communityApplication } = getAppContext()

  const [isJoining, setIsJoining] = useState(false)

  // Initialize communities on mount
  useEffect(() => {
    if (status === 'uninitialized') {
      communityApplication.requestCommunities()
    }
  }, [status, communityApplication])

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
    isLoading: status === 'loading',
    isJoining,
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
    isLoading,
    isJoining,
    handleJoinCommunity,
    handleRefresh,
  } = useCommunitiesScreen()
  const { openCommunityForm } = useCommunityCreator()

  // Open overlay to join an existing community
  const handleOpenJoinOverlay = () => {
    setOverlay(
      'joinCommunity',
      <CommunityJoin
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
        <CommunityList
          communities={communities}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          onCreatePress={openCommunityForm}
          onJoinPress={handleOpenJoinOverlay}
        />
      </Stack>
    </Page>
  )
}

export default CommunitiesScreen
