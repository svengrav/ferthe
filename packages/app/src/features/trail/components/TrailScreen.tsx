import { useSettingsPage } from '@app/features/settings'
import { useTrails, useTrailStatus } from '@app/features/trail/stores/trailStore'
import { Page, Stack } from '@app/shared/components'
import Header from '@app/shared/components/header/Header'
import { useLocalization } from '@app/shared/localization'
import { Trail } from '@shared/contracts'
import { useEffect } from 'react'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import TrailList from './TrailList'
import { useTrailPage } from './TrailPage'

/**
 * Hook to manage trail screen state and interactions
 */
const useTrailScreen = () => {
  const trails = useTrails()
  const status = useTrailStatus()
  const { trailApplication } = getAppContextStore()
  const { showTrailPage } = useTrailPage()

  // Initialize trail data if needed
  useEffect(() => {
    if (status === 'uninitialized') {
      trailApplication.requestTrailState()
    }
  }, [status, trailApplication])

  const handleRefresh = () => {
    trailApplication.requestTrailState()
  }

  const handleOpenTrail = (trail: Trail) => {
    showTrailPage(trail)
  }

  const isRefreshing = status === 'loading'

  return {
    trails,
    isRefreshing,
    handleRefresh,
    handleOpenTrail,
  }
}

/**
 * Trail screen component that displays a list of available trails.
 * Shows an intro screen when no trails are available and includes settings access.
 */
function TrailScreen() {
  const { locales } = useLocalization()
  const { trails, isRefreshing, handleRefresh, handleOpenTrail } = useTrailScreen()
  const { showSettings } = useSettingsPage()

  const pageOptions = [
    { label: locales.navigation.settings, onPress: showSettings },
  ]

  return (
    <Page options={pageOptions}>
      <Stack>
        <Header title={locales.trails.yourTrails} />
        <TrailList
          trails={trails}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onOpenTrail={handleOpenTrail}
        />
      </Stack>
    </Page>
  )
}

export default TrailScreen
