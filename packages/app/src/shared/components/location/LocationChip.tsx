import { GeoLocation } from '@shared/geo'
import { StyleProp, ViewStyle } from 'react-native'
import Chip from '../chip/Chip.tsx'

interface LocationChipProps {
  location?: GeoLocation
  style?: StyleProp<ViewStyle>
  onPress?: () => void
}

/**
 * Chip displaying a geographic coordinate pair.
 */
function LocationChip({ location, style, onPress }: LocationChipProps) {
  const label = location
    ? `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`
    : 'Location data not available'

  return <Chip icon="pin-drop" variant="primary" label={label} style={style} onPress={onPress} />
}

export default LocationChip
