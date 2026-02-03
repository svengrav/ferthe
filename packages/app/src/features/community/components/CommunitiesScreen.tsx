import { useCallback, useEffect, useState } from 'react'
import { FlatList, TextInput, View } from 'react-native'

import { getAppContext } from '@app/appContext'
import { AccountView } from '@app/features/account/components/AccountView'
import { useAccountData } from '@app/features/account/stores/accountStore'
import { useTrails } from '@app/features/trail/stores/trailStore'
import { Avatar, Button, IconButton, Page, Picker, Text } from '@app/shared/components'
import { setOverlay } from '@app/shared/overlay'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'

import { useCommunityData, useCommunityStatus } from '../stores/communityStore'
import CommunityCard from './CommunityCard'

const INVITE_CODE_LENGTH = 6

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
  const [newCommunityName, setNewCommunityName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [selectedTrailId, setSelectedTrailId] = useState<string>('')

  // Initialize communities on mount
  useEffect(() => {
    if (status === 'uninitialized') {
      communityApplication.requestCommunities()
    }
  }, [status, communityApplication])

  const handleCreateCommunity = useCallback(async () => {
    if (!newCommunityName.trim() || !selectedTrailId) return

    setIsCreating(true)
    const result = await communityApplication.createCommunity({ name: newCommunityName.trim(), trailIds: [selectedTrailId] })
    setIsCreating(false)

    if (result.success) {
      setNewCommunityName('')
      setSelectedTrailId('')
    }
  }, [newCommunityName, selectedTrailId, communityApplication])

  const handleJoinCommunity = useCallback(async () => {
    if (!inviteCode.trim()) return

    setIsJoining(true)
    const result = await communityApplication.joinCommunity(inviteCode.trim().toUpperCase())
    setIsJoining(false)

    if (result.success) {
      setInviteCode('')
    }
  }, [inviteCode, communityApplication])

  const handleRefresh = useCallback(() => {
    communityApplication.requestCommunities()
  }, [communityApplication])

  return {
    communities,
    trails,
    isLoading: status === 'loading',
    isCreating,
    isJoining,
    newCommunityName,
    setNewCommunityName,
    inviteCode,
    setInviteCode,
    selectedTrailId,
    setSelectedTrailId,
    handleCreateCommunity,
    handleJoinCommunity,
    handleRefresh,
    INVITE_CODE_LENGTH,
  }
}

/**
 * Screen for managing communities: creating new communities, joining with invite codes, and viewing existing communities.
 */
function CommunitiesScreen() {
  const { styles } = useApp(useStyles)
  const { account } = useAccountData()
  const {
    communities,
    trails,
    isLoading,
    isCreating,
    isJoining,
    newCommunityName,
    setNewCommunityName,
    inviteCode,
    setInviteCode,
    selectedTrailId,
    setSelectedTrailId,
    handleCreateCommunity,
    handleJoinCommunity,
    handleRefresh,
    INVITE_CODE_LENGTH,
  } = useCommunitiesScreen()

  if (!styles) return null

  const trailOptions = trails.map(trail => ({
    label: trail.name,
    value: trail.id,
  }))

  const renderEmptyState = () => (
    <Text variant="body" style={styles.emptyState}>
      No communities yet. Create or join one!
    </Text>
  )

  const renderCommunitiesList = () => (
    <FlatList
      data={communities}
      renderItem={({ item }) => <CommunityCard community={item} />}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContent}
      refreshing={isLoading}
      onRefresh={handleRefresh}
    />
  )

  return (
    <Page action={<IconButton name="person" onPress={() => setOverlay('accountView', <AccountView />)} />} scrollable>
      <View style={styles.avatar}>
        <Avatar size={80} avatarUrl={account?.avatarUrl || ''} />
        <Text variant='subtitle' style={styles.avatarName}>
          {account?.displayName}
        </Text>
      </View>

      <Text variant="heading">Communities</Text>

      <View style={styles.content}>
        {/* Create Community */}
        <View style={styles.section}>
          <Text variant="label">Create New Community</Text>
          <View style={styles.inputColumn}>
            <TextInput
              style={styles.input}
              placeholder="Community Name"
              value={newCommunityName}
              onChangeText={setNewCommunityName}
            />
            <Picker
              options={trailOptions}
              selected={selectedTrailId}
              onValueChange={setSelectedTrailId}
            />
            <Button
              label="Create"
              onPress={handleCreateCommunity}
              disabled={isCreating || !newCommunityName.trim() || !selectedTrailId}
            />
          </View>
        </View>

        {/* Join Community */}
        <View style={styles.section}>
          <Text variant="label">Join with Invite Code</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Your Code"
              value={inviteCode}
              onChangeText={text => setInviteCode(text.toUpperCase())}
              maxLength={INVITE_CODE_LENGTH}
            />
            <Button
              label="Join"
              onPress={handleJoinCommunity}
              disabled={isJoining || inviteCode.length !== INVITE_CODE_LENGTH}
            />
          </View>
        </View>

        {/* Communities List */}
        <View style={styles.listSection}>
          <Text variant="section">My Communities</Text>
          {communities.length === 0 ? renderEmptyState() : renderCommunitiesList()}
        </View>
      </View>
    </Page>
  )
}

const useStyles = createThemedStyles(theme => ({
  avatar: {
    paddingVertical: 12,
  },
  avatarName: {
    textAlign: 'center',
    marginTop: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputColumn: {
    gap: 12,
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
  emptyState: {
    textAlign: 'center',
    marginTop: 24,
  },
}))

export default CommunitiesScreen
