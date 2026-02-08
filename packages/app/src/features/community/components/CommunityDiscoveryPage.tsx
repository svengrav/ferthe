import { getAppContext } from '@app/appContext'
import { Avatar, Button, Page, PageTab, PageTabs, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { closeOverlay, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'
import { Discovery } from '@shared/contracts'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native'
import { useCommunityData } from '../stores/communityStore'
import { useCommunityUpdaterCard } from './CommunityUpdaterCard.tsx'
import SharedDiscoveryCard from './SharedDiscoveryCard'

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
 */
const useSharedDiscoveries = (communityId: string) => {
  const { communityApplication } = getAppContext()
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadDiscoveries = useCallback(async (isRefresh = false) => {
    // Set appropriate loading state
    if (isRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    const result = await communityApplication.getSharedDiscoveries(communityId)

    setIsLoading(false)
    setIsRefreshing(false)

    if (result.success && result.data) {
      setDiscoveries(result.data)
      logger.log(`Loaded ${result.data.length} shared discoveries`)
    } else {
      logger.error('Failed to load shared discoveries:', result.error)
    }
  }, [communityId, communityApplication])

  // Initial load
  useEffect(() => {
    loadDiscoveries()
  }, [loadDiscoveries])

  return {
    discoveries,
    isLoading,
    isRefreshing,
    loadDiscoveries,
  }
}

/**
 * Screen displaying all shared discoveries in a community.
 * Shows community header with edit option and tabbed content.
 */
function CommunityDiscoveryPage({ communityId, communityName, onBack }: CommunityDiscoveriesScreenProps) {
  const { styles } = useTheme(createStyles)
  const { t } = useLocalizationStore()
  const { discoveries, isLoading, isRefreshing, loadDiscoveries } = useSharedDiscoveries(communityId)
  const { communities } = useCommunityData()
  const { showCommunityUpdaterCard } = useCommunityUpdaterCard()

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
        {t.community.noDiscoveriesYet}
      </Text>
      <Text variant="caption" style={styles.emptyHint}>
        {t.community.shareFromProfile}
      </Text>
    </View>
  )

  // Render discovery list
  const renderDiscoveryList = () => (
    <FlatList
      data={discoveries}
      renderItem={({ item }) => (
        <SharedDiscoveryCard
          discovery={item}
          communityId={communityId}
          onUnshared={() => loadDiscoveries()}
        />
      )}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContent}
      refreshing={isRefreshing}
      onRefresh={() => loadDiscoveries(true)}
    />
  )

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
        options={[{ label: t.common.edit, onPress: handleEdit }]}
      />}
    >

      {/* Content tabs */}
      <PageTabs variant="chips" defaultTab="overview">
        <PageTab id="overview" label={t.community.overview}>
          <Avatar />
          {discoveries.length === 0 ? renderEmptyState() : renderDiscoveryList()}
        </PageTab>
        <PageTab id="members" label={t.community.members}>
          <View />
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
})

export default CommunityDiscoveryPage
