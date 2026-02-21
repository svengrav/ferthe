import AccountPage from '@app/features/account/components/AccountPage'
import { useAccountData } from '@app/features/account/stores/accountStore'
import { Avatar, Button, Page, Stack } from '@app/shared/components'
import { Header } from '@app/shared/components/'
import { useLocalization } from '@app/shared/localization'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { useEffect } from 'react'
import { useCommunityData, useCommunityStatus } from '../stores/communityStore'
import { useCommunityJoinCard } from './CommunityJoin'
import { CommunityList } from './CommunityList'

const AVATAR_SIZE = 80

/**
 * Screen for managing communities: creating new communities, joining with invite codes, and viewing existing communities.
 */
function CommunitiesScreen() {
  const { locales } = useLocalization()
  const { account } = useAccountData()
  const { communities } = useCommunityData()
  const status = useCommunityStatus()
  const { communityApplication } = getAppContextStore()
  const { showCommunityJoinCard } = useCommunityJoinCard()

  // Initialize communities on mount
  useEffect(() => {
    if (status === 'uninitialized') {
      communityApplication.requestCommunities()
    }
  }, [status, communityApplication])

  const handleRefresh = () => {
    communityApplication.requestCommunities()
  }

  // Open account view overlay
  const handleOpenAccountOverlay = () => {
    setOverlay('accountView', <AccountPage onBack={() => closeOverlay('accountView')} />)
  }

  const displayName = account?.displayName || locales.community.defaultName
  const greeting = `${locales.community.greeting}, ${displayName}`

  return (
    <Page scrollable trailing={<Button icon="person" onPress={handleOpenAccountOverlay} />} >
      <Stack>
        <Header title={greeting} />
        <Avatar size={AVATAR_SIZE} avatar={account?.avatar} label={account?.displayName} />
        <Header title={locales.community.communities} />
        <CommunityList
          communities={communities}
          isLoading={status === 'loading'}
          onRefresh={handleRefresh}
          onJoinPress={showCommunityJoinCard}
        />
      </Stack>
    </Page>
  )
}

export default CommunitiesScreen
