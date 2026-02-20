import { Icon } from '@app/shared/components'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { View } from 'react-native'

/**
 * Lock icon overlay for undiscovered spots.
 * Absolutely positioned at bottom center.
 */
function SpotLockIcon() {
  const { styles } = useTheme(useStyles)

  return (
    <View style={styles.lockIconContainer}>
      <Icon name="lock" size={20} color="white" />
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  lockIconContainer: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
  },
}))

export default SpotLockIcon
