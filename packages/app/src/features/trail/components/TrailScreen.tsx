import { getAppContext } from '@app/appContext'
import { SettingsPage } from '@app/features/settings'
import { useTrailData, useTrailStatus } from '@app/features/trail/stores/trailStore'
import { Button, FertheLogo, Page, Stack, Text } from '@app/shared/components'
import Header from '@app/shared/components/header/Header'
import { closeOverlay, setOverlay } from '@app/shared/overlay/useOverlayStore'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { Trail } from '@shared/contracts'
import { useEffect } from 'react'
import { FlatList, View } from 'react-native'
import TrailItem from './TrailItem'
import TrailDetails from './TrailPage'

const INTRO_PADDING = 16
const INTRO_MAX_WIDTH = 200
const INTRO_MARGIN_TOP = 10
const INTRO_MARGIN_BOTTOM = 25
const INTRO_LINE_HEIGHT = 30
const LOGO_MARGIN_BOTTOM = 10
const LIST_GAP = 8

/**
 * Hook to manage trail screen state and interactions
 */
const useTrailScreen = () => {
  const { trails } = useTrailData()
  const status = useTrailStatus()
  const { trailApplication } = getAppContext()

  // Initialize trail data if needed
  useEffect(() => {
    if (status === 'uninitialized') {
      trailApplication.requestTrailState()
    }
  }, [status, trailApplication])

  const handleRefresh = () => {
    trailApplication.requestTrailState()
  }

  const openSettings = () => {
    let removeOverlay: (() => void) | undefined

    removeOverlay = setOverlay('settingsForm',
      <SettingsPage
        onClose={() => removeOverlay?.()}
        onSubmit={() => removeOverlay?.()}
      />,
      {
        variant: 'fullscreen',
        title: 'Settings'
      })
  }

  const isRefreshing = status === 'loading'
  const hasTrails = trails.length > 0

  return {
    trails,
    isRefreshing,
    hasTrails,
    handleRefresh,
    openSettings,
  }
}

/**
 * Trail screen component that displays a list of available trails.
 * Shows an intro screen when no trails are available and includes settings access.
 */
function TrailScreen() {
  const { styles, locales, theme } = useApp(useStyles)
  const {
    trails,
    isRefreshing,
    hasTrails,
    handleRefresh,
    openSettings,
  } = useTrailScreen()


  const handleOpenTrailOverview = (trail: Trail) => {
    const overlayId = 'trailDetails-' + trail.id
    setOverlay(overlayId, <TrailDetails trail={trail} onBack={() => closeOverlay(overlayId)} />)
  }

  if (!styles) return null

  const pageOptions = [
    { label: locales.navigation.settings, onPress: openSettings },
  ]

  return (
    <Page options={pageOptions}>
      <Stack>
        {/* Header section */}
        <Header title={locales.trails.yourTrails} />
        {/* Main content */}
        {hasTrails ? (
          <FlatList
            data={trails}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TrailItem trail={item}
                onPress={() => handleOpenTrailOverview(item)}
                actions={
                  <Button icon='chevron-right' variant='secondary' onPress={() => handleOpenTrailOverview(item)} />
                } />)}
            keyExtractor={item => item.id}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
          />
        ) : (
          <View style={styles.intro}>
            <FertheLogo style={styles.logo} />
            <Text style={styles.introText}>{locales.trails.everyJourney}</Text>
          </View>
        )}
      </Stack>
    </Page>
  )
}

const useStyles = createThemedStyles(theme => ({
  content: {
    paddingHorizontal: 4,
    flex: 1,
  },
  intro: {
    padding: INTRO_PADDING,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: {
    maxWidth: INTRO_MAX_WIDTH,
    textAlign: 'center',
    color: theme.colors.onBackground,
    marginTop: INTRO_MARGIN_TOP,
    marginBottom: INTRO_MARGIN_BOTTOM,
    lineHeight: INTRO_LINE_HEIGHT,
  },
  logo: {
    marginBottom: LOGO_MARGIN_BOTTOM,
  },
  listContent: {
    gap: LIST_GAP,
  },
}))

export default TrailScreen
