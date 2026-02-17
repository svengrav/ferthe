import { createThemedStyles, useTheme } from '@app/shared/theme'
import { ReactNode } from 'react'
import { View } from 'react-native'
import { getMapThemeDefaults } from '../config/mapThemeDefaults'

interface MapToolbarProps {
  leading?: ReactNode
  center?: ReactNode
  trailing?: ReactNode
}

/**
 * MapToolbar - Layout component for 3-part toolbar (leading/center/trailing).
 * Provides consistent spacing and alignment for map controls.
 */
function MapToolbar({ leading, center, trailing }: MapToolbarProps) {
  const { styles } = useTheme(useStyles)

  return (
    <View style={styles.container}>
      <View style={styles.side}>{leading}</View>
      <View style={styles.center}>{center}</View>
      <View style={styles.side}>{trailing}</View>
    </View>
  )
}

const SIDE_WIDTH = 48
const { toolbar } = getMapThemeDefaults()

const useStyles = createThemedStyles(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.tokens.spacing.md,
    backgroundColor: toolbar.backgroundColor
  },
  side: {
    width: SIDE_WIDTH,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
}))

export default MapToolbar
