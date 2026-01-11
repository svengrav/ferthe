import { getAppContext } from '@app/appContext'
import { SettingsForm } from '@app/features/settings'
import { useTrailData, useTrailStatus } from '@app/features/trail/stores/trailStore'
import { FertheLogo, Page, Text } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { useEffect, useState } from 'react'
import { FlatList, View } from 'react-native'
import TrailCard from './TrailCard'

const HEADER_PADDING_HORIZONTAL = 4
const HEADER_PADDING_VERTICAL = 8
const HEADER_MARGIN_BOTTOM = 8
const INTRO_PADDING = 16
const INTRO_MAX_WIDTH = 200
const INTRO_MARGIN_TOP = 10
const INTRO_MARGIN_BOTTOM = 25
const INTRO_LINE_HEIGHT = 30
const LOGO_MARGIN_BOTTOM = 10
const LIST_GAP = 16

/**
 * Hook to manage trail screen state and interactions
 */
const useTrailScreen = () => {
  const { trails } = useTrailData()
  const status = useTrailStatus()
  const [settingsVisible, setSettingsVisible] = useState(false)
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

  const openSettings = () => setSettingsVisible(true)
  const closeSettings = () => setSettingsVisible(false)

  const isRefreshing = status === 'loading'
  const hasTrails = trails.length > 0

  return {
    trails,
    settingsVisible,
    isRefreshing,
    hasTrails,
    handleRefresh,
    openSettings,
    closeSettings,
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
    settingsVisible,
    isRefreshing,
    hasTrails,
    handleRefresh,
    openSettings,
    closeSettings,
  } = useTrailScreen()

  if (!styles) return null

  const pageOptions = [{ label: 'Settings', onPress: openSettings }]

  const handleSettingsSubmit = () => {
    // TODO: Implement settings submission logic
  }

  const renderTrailItem = ({ item }) => (
    <TrailCard trail={item} />
  )

  return (
    <Page options={pageOptions}>
      {/* Header section */}
      <Text style={theme.layout.header}>{locales.trails.yourTrails}</Text>

      {/* Main content */}
      <View style={styles.content}>
        {hasTrails ? (
          <FlatList
            data={trails}
            contentContainerStyle={styles.listContent}
            renderItem={renderTrailItem}
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
      </View>

      {/* Settings modal */}
      <SettingsForm
        visible={settingsVisible}
        onClose={closeSettings}
        onSubmit={handleSettingsSubmit}
      />
    </Page>
  )
}

const useStyles = createThemedStyles(theme => ({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HEADER_PADDING_HORIZONTAL,
    paddingVertical: HEADER_PADDING_VERTICAL,
    marginBottom: HEADER_MARGIN_BOTTOM,
  },
  headerContent: {
    paddingVertical: HEADER_PADDING_VERTICAL,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'flex-end',
  },
  title: {
    ...theme.text.size.lg,
    fontFamily: theme.text.primary.semiBold,
    width: '100%',
    textAlign: 'center',
    position: 'absolute',
    color: theme.colors.onBackground,
  },
  content: {
    flex: 1,
  },
  intro: {
    padding: INTRO_PADDING,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: {
    ...theme.text.size.md,
    maxWidth: INTRO_MAX_WIDTH,
    textAlign: 'center',
    color: theme.colors.onBackground,
    marginTop: INTRO_MARGIN_TOP,
    marginBottom: INTRO_MARGIN_BOTTOM,
    fontFamily: theme.text.primary.semiBold,
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
