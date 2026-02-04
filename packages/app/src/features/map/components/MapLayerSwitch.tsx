import { Button } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { View } from 'react-native'
import { useMapLayer, useSetActiveLayer } from '../stores/mapStore'

/**
 * Button to switch between Canvas (navigation) and Overview (trail) modes
 */
function MapLayerSwitch() {
  const { styles } = useApp(useStyles)
  const mapLayer = useMapLayer()
  const setMapLayer = useSetActiveLayer()

  const isOverview = mapLayer === 'OVERVIEW'

  const handlePress = () => {
    setMapLayer(isOverview ? 'CANVAS' : 'OVERVIEW')
  }

  return (
    <View style={styles?.container}>
      <Button
        icon={isOverview ? 'navigation' : 'map'}
        onPress={handlePress}
      />
    </View>
  )
}

const useStyles = createThemedStyles(() => ({
  container: {
    position: 'absolute',
    top: 14,
    right: 10,
    alignItems: 'center',
    zIndex: 50,
  },
}))

export default MapLayerSwitch
