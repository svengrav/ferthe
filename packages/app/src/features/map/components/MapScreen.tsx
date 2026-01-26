import { LoadingSpinner, Page } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { setOverlay } from '@app/shared/overlay'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { SettingsForm } from '../../settings/components/SettingsForm'
import { useMapStatus, useMapViewport, useSetViewport } from '../stores/mapStore'
import { Map } from './Map'
import MapCompass from './MapCompass'
import MapDiscoveryCard from './MapDiscoveryCard'
import { MapTrailSelector } from './MapTrailSelector'

function MapScreen() {
  const { styles, context } = useApp(theme => useStyles(theme))
  const { t } = useLocalizationStore()
  const status = useMapStatus()
  const setViewport = useSetViewport()
  const viewPort = useMapViewport()
  const opacity = useSharedValue(0)

  useEffect(() => {
    context.mapApplication.requestMapState()
  }, [status, viewPort])

  useEffect(() => {
    if (status === 'ready') {
      opacity.value = withTiming(1, { duration: 500 })
    } else {
      opacity.value = 0
    }
  }, [status])

  const animatedStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: opacity.value,
  }))

  const onLayout = (layout: { nativeEvent: { layout: { width: number; height: number } } }) => {
    setViewport(layout.nativeEvent.layout)
  }

  return (
    <Page options={[{ label: t.navigation.settings, onPress: () => setOverlay('settingsForm', <SettingsForm onClose={() => { }} onSubmit={() => { }} />) }]}>
      <View style={styles?.container} >
        <MapDiscoveryCard />
        <MapCompass />
        <View style={styles?.map} onLayout={onLayout}>
          {status !== 'ready' ? (
            <LoadingSpinner />
          ) : (
            <Animated.View style={animatedStyle}>
              <Map />
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
  },
  container: {
    position: 'relative' as const,
    flex: 1,
  },
}))

export default MapScreen
