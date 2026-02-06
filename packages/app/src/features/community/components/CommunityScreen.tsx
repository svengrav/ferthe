import { getAppContext } from '@app/appContext'
import AccountView from '@app/features/account/components/AccountView'
import { useAccountData } from '@app/features/account/stores/accountStore'
import { Avatar, Button, Page, Stack } from '@app/shared/components'
import { Header } from '@app/shared/components/'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { setOverlay } from '@app/shared/overlay'
import { useCallback, useEffect } from 'react'
import { useCommunityData, useCommunityStatus } from '../stores/communityStore'
import { CommunityJoin } from './CommunityJoin'
import { CommunityList } from './CommunityList'

const AVATAR_SIZE = 80

/**
 * Screen for managing communities: creating new communities, joining with invite codes, and viewing existing communities.
 */
function CommunitiesScreen() {
  const { t } = useLocalizationStore()
  const { account } = useAccountData()
  const { communities } = useCommunityData()
  const status = useCommunityStatus()
  const { communityApplication } = getAppContext()

  // Initialize communities on mount
  useEffect(() => {
    if (status === 'uninitialized') {
      communityApplication.requestCommunities()
    }
  }, [status, communityApplication])

  const handleRefresh = useCallback(() => {
    communityApplication.requestCommunities()
  }, [communityApplication])

  // Open overlay to join an existing community
  const handleOpenJoinOverlay = () => {
    setOverlay('joinCommunity', <CommunityJoin />, { variant: 'compact' })
  }

  // Open account view overlay
  const handleOpenAccountOverlay = () => {
    setOverlay('accountView', <AccountView />, { variant: 'page', title: 'Account' })
  }

  const displayName = account?.displayName || t.community.defaultName
  const greeting = `${t.community.greeting}, ${displayName}`

  return (
    <Page scrollable trailing={<Button icon="person" onPress={handleOpenAccountOverlay} />} >
      <Stack>
        <Header title={greeting} />
        <Avatar size={AVATAR_SIZE} avatar={account?.avatar} label={account?.displayName} />
        <Header title={t.community.communities} />
        <CommunityList
          communities={communities}
          isLoading={status === 'loading'}
          onRefresh={handleRefresh}
          onJoinPress={handleOpenJoinOverlay}
        />
      </Stack>
    </Page>
  )
}

export default CommunitiesScreen
