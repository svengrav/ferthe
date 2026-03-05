import { Theme, useTheme } from '@app/shared/theme'
import { ReactNode } from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import Text from '../text/Text'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  leading?: ReactNode
  trailing?: ReactNode
  style?: StyleProp<ViewStyle>
}

/**
 * Section header with optional leading slot, title+subtitle content, and trailing actions slot.
 */
function SectionHeader(props: SectionHeaderProps) {
  const { title, subtitle, leading, trailing, style } = props
  const { styles } = useTheme(createStyles)

  return (
    <View style={[styles.container, style]} id="section-header">
      {leading && <View style={styles.leading}>{leading}</View>}
      <View style={styles.content}>
        <Text variant="title">{title}</Text>
        {!!subtitle && <Text variant="subtitle">{subtitle}</Text>}
      </View>
      {trailing && <View style={styles.trailing}>{trailing}</View>}
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leading: {
    marginRight: theme.tokens.spacing.md,
  },
  content: {
    flex: 1,
  },
  trailing: {
    flexDirection: 'row',
    gap: theme.tokens.spacing.md,
  },
})

export default SectionHeader
