import { LoadingSpinner, Page } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { logger } from '@app/shared/utils/logger'
import { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'
import { useSettingsPage } from '../../settings/components/SettingsPage'
import { getMapStoreActions, useMapLayer, useMapStatus } from '../stores/mapStore'
import { Map } from './Map'
import MapCompass from './MapCompass'
import MapDiscoveryCard from './MapDiscoveryCard'
import MapDistanceWarning from './MapDistanceWarning'
import MapLayerSwitch from './MapLayerSwitch'
import MapOverlay from './MapOverlay'
import { MapTrailSelector } from './MapTrailSelector'

function MapScreen() {
  const { styles, context } = useApp(theme => useStyles(theme))
  const { t } = useLocalizationStore()
  const status = useMapStatus()
  const activeLayer = useMapLayer()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const { setContainer } = getMapStoreActions()

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
    <Page inset='none' options={[{ label: t.navigation.settings, onPress: () => showSettings() }]}>
      <View style={styles?.container} >
        <MapDiscoveryCard />
        <MapCompass />
        <MapLayerSwitch />
        <MapDistanceWarning />
        <View style={styles?.map} onLayout={onLayout}>
          {status !== 'ready' ? (
            <LoadingSpinner />
          ) : (
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
              {activeLayer === 'CANVAS' ? <Map /> : <MapOverlay />}
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
