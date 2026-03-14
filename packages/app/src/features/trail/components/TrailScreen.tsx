import { useSettingsPage } from '@app/features/settings'
import { isStumbleTrail } from '@app/features/stumble'
import { useTrails } from '@app/features/trail/stores/trailStore'
import { useTrailPagination } from '@app/features/trail/hooks/useTrailPagination'
import { Button, Page, Stack, Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { Trail } from '@shared/contracts'
import TrailItem from './TrailItem'
import TrailList from './TrailList'
import { useTrailPage } from './TrailPage'

/**
 * Hook to manage trail screen state and interactions
 */
const useTrailScreen = () => {
  const trails = useTrails()
  const { showTrailPage } = useTrailPage()
  const pagination = useTrailPagination()

  const handleOpenTrail = (trail: Trail) => showTrailPage(trail)

  const stumbleTrails = trails.filter(isStumbleTrail)
  const regularTrails = trails.filter(t => !isStumbleTrail(t))

  return {
    stumbleTrails,
    regularTrails,
    isRefreshing: pagination.isRefreshing,
    loadingMore: pagination.isLoading,
    handleRefresh: pagination.refresh,
    loadMore: pagination.loadMore,
    handleOpenTrail,
  }
}

/**
 * Trail screen component that displays a list of available trails.
 * Stumble trails appear above the regular trail list.
 * Shows an intro screen when no trails are available and includes settings access.
 */
function TrailScreen() {
  const { locales } = useLocalization()
  const { stumbleTrails, regularTrails, isRefreshing, loadingMore, handleRefresh, loadMore, handleOpenTrail } = useTrailScreen()
  const { showSettings } = useSettingsPage()

  const pageOptions = [
    { label: locales.navigation.settings, onPress: showSettings },
  ]

  return (
    <Page
      screen
      options={pageOptions}
    >
      <Stack>
        <Text variant="heading">Stumble</Text>
        {stumbleTrails.map(trail => (
          <TrailItem
            key={trail.id}
            trail={trail}
            onPress={() => handleOpenTrail(trail)}
            trailing={<Button icon="chevron-right" variant="secondary" onPress={() => handleOpenTrail(trail)} />}
          />
        ))}
        <Text variant="heading">{locales.trails.yourTrails}</Text>
        <TrailList
          trails={regularTrails}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onEndReached={loadMore}
          loadingMore={loadingMore}
          onPress={handleOpenTrail}
        />
      </Stack>
    </Page>
  )
}

export default TrailScreen
