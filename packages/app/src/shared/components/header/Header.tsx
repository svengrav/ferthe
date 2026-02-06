import { Theme, useTheme } from '@app/shared/theme'
import { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import Text from '../text/Text'

const SLOT_WIDTH = 40

interface HeaderProps {
  title: string
  leading?: ReactNode
  trailing?: ReactNode
}

/**
 * Reusable screen header with centered title and optional left/right icon slots.
 * Used for consistent header layout across screens.
 */
function Header(props: HeaderProps) {
  const { title, leading, trailing } = props
  const { styles } = useTheme(createStyles)

  return (
    <View style={styles.container}>
      <View style={styles.slot}>
        {leading}
      </View>
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      <View style={styles.slot}>
        {trailing}
      </View>
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slot: {
    width: SLOT_WIDTH,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
})

export default Header
