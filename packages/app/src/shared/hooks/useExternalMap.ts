import { GeoLocation } from '@shared/geo'
import { Linking, Platform } from 'react-native'

/**
 * Opens the device's default map app at the given coordinates.
 */
export const useExternalMap = () => {
  const openMap = (location: GeoLocation) => {
    const { lat, lon } = location
    const url = Platform.OS === 'ios'
      ? `maps://maps.apple.com/?q=${lat},${lon}`
      : `geo:${lat},${lon}?q=${lat},${lon}`
    Linking.openURL(url)
  }

  return { openMap }
}
