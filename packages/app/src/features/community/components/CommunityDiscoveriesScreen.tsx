import { getAppContext } from '@app/appContext'
import { Button, ScreenHeader, Text } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { logger } from '@app/shared/utils/logger'
import { Discovery } from '@shared/contracts'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, View } from 'react-native'
import SharedDiscoveryCard from './SharedDiscoveryCard'

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
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadDiscoveries = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
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

  useEffect(() => {
    loadDiscoveries()
  }, [loadDiscoveries])

  const handleRefresh = useCallback(() => {
    loadDiscoveries(true)
  }, [loadDiscoveries])

  return {
    discoveries,
    isLoading,
    isRefreshing,
    handleRefresh,
    reloadDiscoveries: () => loadDiscoveries(false),
  }
}

/**
 * Screen displaying all shared discoveries in a community.
 * Allows members to view and unshare their own discoveries.
 */
function CommunityDiscoveriesScreen({ communityId, communityName, onBack }: CommunityDiscoveriesScreenProps) {
  const { styles } = useApp(useStyles)
  const { discoveries, isLoading, isRefreshing, handleRefresh, reloadDiscoveries } = useSharedDiscoveries(communityId)

  if (!styles) return null

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" />
        </View>
      )
    }

    return (
      <View style={styles.emptyState}>
        <Text variant="body" style={styles.emptyText}>
          No discoveries shared yet
        </Text>
        <Text variant="caption" style={styles.emptyHint}>
          Share discoveries from your profile to see them here
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={communityName}
        trailing={<Button icon='more-vert' variant='outlined' options={[]} />}
      />

      {discoveries.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={discoveries}
          renderItem={({ item }) => (
            <SharedDiscoveryCard
              discovery={item}
              communityId={communityId}
              onUnshared={reloadDiscoveries}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    flex: 1,
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
}))

export default CommunityDiscoveriesScreen
