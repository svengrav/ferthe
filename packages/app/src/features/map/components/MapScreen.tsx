import { LoadingSpinner, Page } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'
import { useMapStatus, useMapViewport, useSetViewport } from '../stores/mapStore'
import { Map } from './Map'
import MapCompass from './MapCompass'
import MapDiscoveryCard from './MapDiscoveryCard'
import { MapTrailSelector } from './MapTrailSelector'

function MapScreen() {
  const { styles, context } = useApp(theme => useStyles(theme))
  const status = useMapStatus()
  const setViewport = useSetViewport()
  const viewPort = useMapViewport()
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    context.mapApplication.requestMapState(viewPort)
  }, [status, viewPort])

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

  const onLayout = (layout: { nativeEvent: { layout: { width: number; height: number } } }) => {
    setViewport(layout.nativeEvent.layout)
  }

  return (
    <Page>
      <View style={styles?.container} >
        <MapDiscoveryCard />
        <MapCompass />
        <View style={styles?.map} onLayout={onLayout}>
          {status !== 'ready' ? (
            <LoadingSpinner />
          ) : (
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
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
    overflow: 'hidden',
    flex: 1,
  },
}))

export default MapScreen
