import { usePublicProfilePage } from '@app/features/account/components/PublicProfilePage'
import SpotCardList from '@app/features/spot/components/SpotCardList'
import { useSpotPage } from '@app/features/spot/components/SpotPage'
import { Avatar, Button, Page, PageTab, PageTabs, Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization/'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { getAppContextStore } from '@app/shared/stores/appContextStore.ts'
import { Theme, useTheme } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'
import { CommunityMemberWithProfile, Discovery, Spot } from '@shared/contracts'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'
import { useCommunityData } from '../stores/communityStore'
import { useCommunityUpdaterCard } from './CommunityUpdaterCard.tsx'

export const useCommunityDiscoveryPage = () => ({
  showCommunityDiscoveries: (communityId: string, communityName: string) => setOverlay(
    'communityDiscoveries',
    <CommunityDiscoveryPage
      communityId={communityId}
      communityName={communityName}
      onBack={() => closeOverlay('communityDiscoveries')}
    />,
  ),
  closeCommunityDiscoveries: () => closeOverlay('communityDiscoveries'),
})

interface CommunityDiscoveriesScreenProps {
  communityId: string
  communityName: string
  onBack?: () => void
}

/**
 * Hook to manage shared discoveries loading and refresh.
 * Also fetches associated spot data to build SpotCardList items.
 */
const useSharedDiscoveries = (communityId: string) => {
  const { communityApplication, spotApplication } = getAppContextStore()
  const [spotItems, setSpotItems] = useState<{ id: string; image?: any; blurredImage?: any; title?: string; isLocked: boolean }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadDiscoveries = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    const result = await communityApplication.getSharedDiscoveries(communityId)

    if (result.success && result.data) {
      const discoveries = result.data
      logger.log(`Loaded ${discoveries.length} shared discoveries`)

      const spotIds = [...new Set(discoveries.map((d: Discovery) => d.spotId))]
      const spotsResult = spotIds.length > 0 ? await spotApplication.getSpotsByIds(spotIds) : { success: true, data: [] as Spot[] }
      const spotsById: Record<string, Spot> = {}
      if (spotsResult.success && spotsResult.data) {
        spotsResult.data.forEach((s: Spot) => { spotsById[s.id] = s })
      }

      setSpotItems(discoveries.map((d: Discovery) => ({
        id: d.spotId,
        image: spotsById[d.spotId]?.image,
        blurredImage: spotsById[d.spotId]?.blurredImage,
        title: spotsById[d.spotId]?.name,
        isLocked: false,
      })))
    } else {
      logger.error('Failed to load shared discoveries:', result.error)
    }

    setIsLoading(false)
    setIsRefreshing(false)
  }, [communityId, communityApplication, spotApplication])

  useEffect(() => {
    loadDiscoveries()
  }, [loadDiscoveries])

  return {
    spotItems,
    isLoading,
    isRefreshing,
    loadDiscoveries,
  }
}

/**
 * Hook to manage community members loading and refresh.
 */
const useCommunityMembers = (communityId: string) => {
  const { communityApplication } = getAppContextStore()
  const [members, setMembers] = useState<CommunityMemberWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadMembers = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    const result = await communityApplication.getCommunityMembers(communityId)

    setIsLoading(false)
    setIsRefreshing(false)

    if (result.success && result.data) {
      setMembers(result.data)
      logger.log(`Loaded ${result.data.length} community members`)
    } else {
      logger.error('Failed to load community members:', result.error)
    }
  }, [communityId, communityApplication])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  return {
    members,
    isLoading,
    isRefreshing,
    loadMembers,
  }
}

/**
 * Screen displaying all shared discoveries in a community.
 * Shows community header with edit option and tabbed content.
 */
function CommunityDiscoveryPage({ communityId, communityName, onBack }: CommunityDiscoveriesScreenProps) {
  const { styles } = useTheme(createStyles)
  const { locales } = useLocalization()
  const { spotItems, isLoading, isRefreshing, loadDiscoveries } = useSharedDiscoveries(communityId)
  const { members, isLoading: membersLoading, isRefreshing: membersRefreshing, loadMembers } = useCommunityMembers(communityId)
  const { communities } = useCommunityData()
  const { showCommunityUpdaterCard } = useCommunityUpdaterCard()
  const { showPublicProfile } = usePublicProfilePage()
  const { showSpotPage } = useSpotPage()

  if (!styles) return null

  // Find current community for edit functionality
  const currentCommunity = useMemo(
    () => communities.find(c => c.id === communityId),
    [communities, communityId]
  )

  // Handle edit button press
  const handleEdit = () => {
    if (currentCommunity) {
      const trailId = currentCommunity.trailIds[0] || ''
      showCommunityUpdaterCard({ communityId: communityId, initialData: { name: currentCommunity.name, trailId } })
    }
  }

  // Render empty state when no discoveries exist
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text variant="body" style={styles.emptyText}>
        {locales.community.noDiscoveriesYet}
      </Text>
      <Text variant="caption" style={styles.emptyHint}>
        {locales.community.shareFromProfile}
      </Text>
    </View>
  )

  // Render discovery list as SpotCardList (same visual as SpotScreen discoveries)
  const renderDiscoveryList = () => (
    <SpotCardList
      items={spotItems}
      onPress={(item) => showSpotPage(item.id)}
      refreshing={isRefreshing}
      onRefresh={() => loadDiscoveries(true)}
    />
  )

  // Render members list
  const renderMembersList = () => {
    if (membersLoading && members.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      )
    }

    if (members.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text variant="body" style={styles.emptyText}>
            No members found
          </Text>
        </View>
      )
    }

    return (
      <FlatList
        data={members}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.memberCard}
            onPress={() => showPublicProfile(item.accountId)}
            activeOpacity={0.7}
          >
            <View style={styles.memberInfo}>
              <Avatar
                size={48}
                avatar={item.profile.avatar}
                label={item.profile.displayName}
              />
              <View style={styles.memberDetails}>
                <Text variant='label'>{item.profile.displayName || 'Unknown User'}</Text>
                <Text variant='body'>{item.profile.spotCount} spots created</Text>
                <Text variant='caption'>Joined: {item.joinedAt.toLocaleDateString()}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={item => `${item.communityId}_${item.accountId}`}
        contentContainerStyle={styles.listContent}
        refreshing={membersRefreshing}
        onRefresh={() => loadMembers(true)}
      />
    )
  }

  // Show loading indicator on initial load
  if (isLoading) {
    return (
      <Page style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </Page>
    )
  }

  return (
    <Page style={styles.container}
      title={communityName}
      leading={<Button icon="arrow-back" variant='outlined' onPress={onBack} />}
      trailing={<Button
        icon="more-vert"
        variant="outlined"
        options={[{ label: locales.common.edit, onPress: handleEdit }]}
      />}
    >

      {/* Content tabs */}
      <PageTabs variant="chips" defaultTab="overview">
        <PageTab id="overview" label={locales.community.overview}>
          {spotItems.length === 0 ? renderEmptyState() : renderDiscoveryList()}
        </PageTab>
        <PageTab id="members" label={locales.community.members}>
          {renderMembersList()}
        </PageTab>
      </PageTabs>
    </Page>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHint: {
    textAlign: 'center',
    opacity: 0.6,
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
})

export default CommunityDiscoveryPage
