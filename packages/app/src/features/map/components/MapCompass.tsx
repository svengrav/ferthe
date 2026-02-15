import { StyleSheet, Text, View } from 'react-native'
import { useMapCompass } from '../stores/mapStore'
import { useMapTheme } from '../stores/mapThemeStore'

const DEFAULT_FONT_SIZE = 24

/**
 * A simple compass component that displays the exact heading in degrees
 * that the device is currently pointing at
 */
function MapCompass() {
  const { heading, direction } = useMapCompass()
  const mapTheme = useMapTheme()

  return (
    <View style={styles.compassBackground}>
      <Text style={[styles.headingText, { color: mapTheme.compass.color, fontSize: DEFAULT_FONT_SIZE }]}>{heading}°</Text>
      <Text style={[styles.directionText, { color: mapTheme.compass.color, fontSize: DEFAULT_FONT_SIZE / 1.5 }]}>{direction}</Text>
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
    backgroundColor: 'black',
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
