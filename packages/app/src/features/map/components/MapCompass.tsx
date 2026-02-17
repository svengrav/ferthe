import { StyleSheet, Text, View } from 'react-native'
import { useMapCompass } from '../stores/mapStore'
import { useMapTheme } from '../stores/mapThemeStore'


/**
 * A simple compass component that displays the exact heading in degrees
 * that the device is currently pointing at
 */
function MapCompass() {
  const { heading, direction } = useMapCompass()
  const { compass } = useMapTheme()

  return (
    <View style={styles.compassBackground}>
      <Text style={[styles.headingText, { color: compass.color, fontSize: compass.fontSize }]}>{heading}°</Text>
      <Text style={[styles.directionText, { color: compass.color, fontSize: compass.fontSize / 1.5 }]}>{direction}</Text>
    </View>
  )
}

export default MapCompass

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  compassBackground: {
    borderBottomWidth: 2,
    paddingVertical: 8,
    gap: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headingText: {
    transform: [{ translateX: 4 }],
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
  },
  directionText: {
    fontWeight: 'condensedBold',
  },
})
