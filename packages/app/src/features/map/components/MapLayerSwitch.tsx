import { View } from 'react-native'

import { IconButton } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'

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
      <IconButton
        name={isOverview ? 'navigation' : 'map'}
        onPress={handlePress}
        size={20}
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
