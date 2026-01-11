import { Chip } from "@app/shared/components"
import { formatGeoCoordinates } from "@shared/geo"
import { memo } from "react"
import { View } from "react-native"
import { useMapDevice } from "../stores/mapStore"

function MapDeviceCords() {
  const device = useMapDevice()
  const label = formatGeoCoordinates(device.location?.lat || 0, device.location?.lon || 0)
  return (
    <View style={styles}>
      <Chip size='small' variant='secondary' label={label} />
    </View>
  )
}

export default memo(MapDeviceCords)

const styles = {
  zIndex: 10,
  padding: 8,
  position: 'absolute' as const,
  flexDirection: 'row' as const,
  justifyContent: 'center' as const,
  top: 0,
  width: '100%' as const,
  alignItems: 'center' as const,
  color: 'gray',
}