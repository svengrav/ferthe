import { LoadingSpinner, Page } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'
import { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'
import { useSettingsPage } from '../../settings/components/SettingsPage'
import { getMapStoreActions, useMapLayer, useMapStatus } from '../stores/mapStore'
import { MapCanvas } from './MapCanvas.tsx'
import MapCompass from './MapCompass'
import MapDistanceWarning from './MapDistanceWarning'
import MapLayerSwitch from './MapLayerSwitch'
import MapOverview from './MapOverview'
import MapToolbar from './MapToolbar'
import { MapTrailSelector } from './MapTrailSelector'
import { getAppContextStore } from '@app/shared/stores/appContextStore.ts'

function MapScreen() {
  const { styles } = useTheme(useStyles)
  const { locales } = useLocalization()
  const status = useMapStatus()
  const activeLayer = useMapLayer()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const { setContainer } = getMapStoreActions()
  const context = getAppContextStore()

  useEffect(() => {
    if (status !== 'uninitialized') {
      logger.log(`[MapScreen] Map status changed: ${status}`)
      return
    }

    const retryInterval = setInterval(() => {
      logger.log('[MapScreen] Requesting map state update...')
      context.mapApplication.requestMapState()
    }, 2000)

    // Initial call
    context.mapApplication.requestMapState()

    return () => clearInterval(retryInterval)
  }, [status])

  useEffect(() => {
    if (status === 'ready') {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start()
    } else {
      fadeAnim.setValue(0)
    }
  }, [status, fadeAnim])

  const onLayout = (event: { nativeEvent: { layout: { width: number; height: number } } }) => {
    const { width, height } = event.nativeEvent.layout
    setContainer({ size: { width, height } })
  }

  const { showSettings } = useSettingsPage()

  return (
    <Page inset='none' options={[{ label: locales.navigation.settings, onPress: () => showSettings() }]}>
      <View style={styles?.container} >
        <MapToolbar center={<MapCompass />} trailing={<MapLayerSwitch />} />
        <MapDistanceWarning />
        <View style={styles?.map} onLayout={onLayout}>
          {status !== 'ready' ? (
            <LoadingSpinner />
          ) : (
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
              {activeLayer === 'CANVAS' ? <MapCanvas /> : <MapOverview />}
            </Animated.View>
          )}
        </View>
        <MapTrailSelector />
      </View>
    </Page>
  )
}

const useStyles = createThemedStyles(theme => ({
  map: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden'
  },
  container: {
    position: 'relative' as const,
    flex: 1,
  },
}))

export default MapScreen
