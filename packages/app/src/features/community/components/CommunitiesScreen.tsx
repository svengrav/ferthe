import { getAppContext } from '@app/appContext'
import { AccountView } from '@app/features/account/components/AccountView'
import { Button, IconButton, Page, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { setOverlay } from '@app/shared/overlay'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { useEffect, useState } from 'react'
import { FlatList, TextInput, View } from 'react-native'
import { useCommunityData, useCommunityStatus } from '../stores/communityStore'
import CommunityCard from './CommunityCard'

const useCommunitiesScreen = () => {
  const { communities } = useCommunityData()
  const status = useCommunityStatus()
  const { communityApplication } = getAppContext()
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [newCommunityName, setNewCommunityName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  useEffect(() => {
    if (status === 'uninitialized') {
      communityApplication.requestCommunities()
    }
  }, [status])

  const handleCreateCommunity = async () => {
    if (!newCommunityName.trim()) return

    setIsCreating(true)
    const result = await communityApplication.createCommunity(newCommunityName.trim())
    setIsCreating(false)

    if (result.success) {
      setNewCommunityName('')
    }
  }

  const handleJoinCommunity = async () => {
    if (!inviteCode.trim()) return

    setIsJoining(true)
    const result = await communityApplication.joinCommunity(inviteCode.trim().toUpperCase())
    setIsJoining(false)

    if (result.success) {
      setInviteCode('')
    }
  }

  const handleRefresh = () => {
    communityApplication.requestCommunities()
  }

  return {
    communities,
    isLoading: status === 'loading',
    isCreating,
    isJoining,
    newCommunityName,
    setNewCommunityName,
    inviteCode,
    setInviteCode,
    handleCreateCommunity,
    handleJoinCommunity,
    handleRefresh,
  }
}

function CommunitiesScreen() {
  const { styles, theme } = useApp(useStyles)
  const { t } = useLocalizationStore()
  const {
    communities,
    isLoading,
    isCreating,
    isJoining,
    newCommunityName,
    setNewCommunityName,
    inviteCode,
    setInviteCode,
    handleCreateCommunity,
    handleJoinCommunity,
    handleRefresh,
  } = useCommunitiesScreen()

  if (!styles) return null

  return (
    <Page action={<IconButton name="person" onPress={() => setOverlay(<AccountView/>)} />}>
      <Text variant="heading">Communities</Text>
      <View style={styles.content}>
        {/* Create Community Section */}
        <View style={styles.section}>
          <Text variant="section">Create New Community</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Community name"
              value={newCommunityName}
              onChangeText={setNewCommunityName}
            />
            <Button label="Create" onPress={handleCreateCommunity} disabled={isCreating || !newCommunityName.trim()} />
          </View>
        </View>

        {/* Join Community Section */}
        <View style={styles.section}>
          <Text variant="section">Join with Invite Code</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="ABCD12"
              value={inviteCode}
              onChangeText={text => setInviteCode(text.toUpperCase())}
              maxLength={6}
            />
            <Button label="Join" onPress={handleJoinCommunity} disabled={isJoining || inviteCode.length !== 6} />
          </View>
        </View>

        {/* Communities List */}
        <View style={styles.listSection}>
          <Text variant="section">My Communities</Text>
          {communities.length === 0 ? (
            <Text variant="caption" style={{ textAlign: 'center', marginTop: 24 }}>No communities yet. Create or join one!</Text>
          ) : (
            <FlatList
              data={communities}
              renderItem={({ item }) => <CommunityCard community={item} />}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              refreshing={isLoading}
              onRefresh={handleRefresh}
            />
          )}
        </View>
      </View>
    </Page>
  )
}

const useStyles = createThemedStyles(theme => ({
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
    color: theme.colors.onSurface,
  },
  listSection: {
    flex: 1,
  },
  listContent: {
    gap: 12,
  },
}))

export default CommunitiesScreen
