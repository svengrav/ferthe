import { getAppContext } from '@app/appContext'
import { useSettingsPage } from '@app/features/settings'
import { useTrails, useTrailStatus } from '@app/features/trail/stores/trailStore'
import { Button, FertheLogo, Page, Stack, Text } from '@app/shared/components'
import Header from '@app/shared/components/header/Header'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { Trail } from '@shared/contracts'
import { useEffect } from 'react'
import { FlatList, View } from 'react-native'
import TrailItem from './TrailItem'
import { useTrailPage } from './TrailPage'

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
  const trails = useTrails()
  const status = useTrailStatus()
  const { trailApplication } = getAppContext()
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
  const hasTrails = trails.length > 0

  return {
    trails,
    isRefreshing,
    hasTrails,
    handleRefresh,
    handleOpenTrail,
  }
}

/**
 * Trail screen component that displays a list of available trails.
 * Shows an intro screen when no trails are available and includes settings access.
 */
function TrailScreen() {
  const { styles } = useTheme(useStyles)
  const { locales } = useApp()
  const {
    trails,
    isRefreshing,
    hasTrails,
    handleRefresh,
    handleOpenTrail,
  } = useTrailScreen()
  const { showSettings } = useSettingsPage()

  if (!styles) return null

  const pageOptions = [
    { label: locales.navigation.settings, onPress: showSettings },
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
                onPress={() => handleOpenTrail(item)}
                actions={
                  <Button icon='chevron-right' variant='secondary' onPress={() => handleOpenTrail(item)} />
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
