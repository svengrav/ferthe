import { memo } from 'react'
import { View } from 'react-native'

import { IconButton } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'

import { MapLayer, useMapLayer, useSetMapLayer } from '../stores/mapStore'

interface MapLayerSwitchProps {
  onLayerChange?: (layer: MapLayer) => void
}

/**
 * Button to switch between Canvas (navigation) and Overview (trail) modes
 */
function MapLayerSwitch(props: MapLayerSwitchProps) {
  const { onLayerChange } = props
  const { styles } = useApp(useStyles)

  const mapLayer = useMapLayer()
  const setMapLayer = useSetMapLayer()

  const isOverview = mapLayer === 'OVERVIEW'

  const handlePress = () => {
    const newLayer: MapLayer = isOverview ? 'CANVAS' : 'OVERVIEW'
    setMapLayer(newLayer)
    onLayerChange?.(newLayer)
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
    top: 8,
    right: 8,
    alignItems: 'center',
    zIndex: 50,
  },
}))

export default memo(MapLayerSwitch)
