import { Button } from '@app/shared/components'
import { View } from 'react-native'
import { useMapLayer, useSetActiveLayer } from '../stores/mapStore'

/**
 * Button to switch between Canvas (navigation) and Overview (trail) modes
 */
function MapLayerSwitch() {
  const mapLayer = useMapLayer()
  const setMapLayer = useSetActiveLayer()

  const isOverview = mapLayer === 'OVERVIEW'

  const handlePress = () => {
    setMapLayer(isOverview ? 'CANVAS' : 'OVERVIEW')
  }

  return (
    <View>
      <Button
        icon={isOverview ? 'navigation' : 'map'}
        onPress={handlePress}
      />
    </View>
  )
}



export default MapLayerSwitch
