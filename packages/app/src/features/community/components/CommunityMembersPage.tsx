import { Avatar, Page, Text } from '@app/shared/components'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'
import { CommunityMember } from '@shared/contracts'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, View } from 'react-native'

export const useCommunityMembersPage = () => ({
  showCommunityMembers: (communityId: string) => setOverlay(
    'communityMembers',
    <CommunityMembersPage
      communityId={communityId}
      onBack={() => closeOverlay('communityMembers')}
    />,
  ),
  closeCommunityMembers: () => closeOverlay('communityMembers'),
})

interface CommunityMembersScreenProps {
  communityId: string
  onBack?: () => void
}

function CommunityMembersPage({ communityId, onBack }: CommunityMembersScreenProps) {
  const { styles, theme } = useTheme(useStyles)
  const { communityApplication } = getAppContextStore()
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMembers()
  }, [communityId])

  const loadMembers = async () => {
    setLoading(true)
    logger.log(`Loading members for community: ${communityId}`)
    const result = await communityApplication.getCommunityMembers(communityId)
    if (result.success && result.data) {
      setMembers(result.data)
      logger.log(`Loaded ${result.data.length} members`)
    } else {
      logger.error('Failed to load members:', result.error)
    }
    setLoading(false)
  }

  if (!styles) return null

  return (
    <Page onBack={onBack}>
      <Text variant='heading'>Community Members</Text>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : members.length === 0 ? (
          <Text>No members found</Text>
        ) : (
          <FlatList
            data={members}
            renderItem={({ item }) => (
              <View style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <Avatar
                    size={48}
                    avatar={item.profile?.avatar}
                    label={item.profile?.displayName}
                  />
                  <View style={styles.memberDetails}>
                    <Text variant='label'>{item.profile?.displayName || 'Unknown User'}</Text>
                    <Text variant='body'>{item.profile?.spotCount} spots created</Text>
                    <Text variant='caption'>Joined: {item.joinedAt.toLocaleDateString()}</Text>
                  </View>
                </View>
              </View>
            )}
            keyExtractor={item => `${item.communityId}_${item.accountId}`}
          />
        )}
      </View>
    </Page>
  )
}

const useStyles = createThemedStyles(theme => ({
  content: {
    flex: 1,
    padding: 16,
  },
  memberCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberDetails: {
    flex: 1,
    gap: 4,
  },
}))

export default CommunityMembersPage
