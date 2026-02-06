import { getAppContext } from '@app/appContext'
import { Page, Text } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { CommunityMember } from '@shared/contracts'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, View } from 'react-native'

interface CommunityMembersScreenProps {
  communityId: string
}

function CommunityMembersPage({ communityId }: CommunityMembersScreenProps) {
  const { styles, theme } = useApp(useStyles)
  const { communityApplication } = getAppContext()
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMembers()
  }, [communityId])

  const loadMembers = async () => {
    setLoading(true)
    const result = await communityApplication.getCommunityMembers(communityId)
    if (result.success && result.data) {
      setMembers(result.data)
    }
    setLoading(false)
  }

  if (!styles) return null

  return (
    <Page>
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
                <Text variant='label'>{item.accountId}</Text>
                <Text>Joined: {item.joinedAt.toLocaleDateString()}</Text>
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
}))

export default CommunityMembersPage
