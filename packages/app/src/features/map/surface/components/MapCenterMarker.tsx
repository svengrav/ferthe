import { memo } from 'react'
import { View } from 'react-native'
import { useMapTheme } from '../../stores/mapThemeStore'


function MapCenterMarker() {
  const mapTheme = useMapTheme()
  return <View style={{
    backgroundColor: mapTheme.center.fill,
    width: 5,
    height: 5,
    position: 'absolute',
    top: '50%',
    borderRadius: 1000,
    left: '50%',
    marginLeft: -2.5,
    marginTop: -2.5,
  }} />
}

export default memo(MapCenterMarker)