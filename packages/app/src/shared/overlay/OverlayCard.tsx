import Button from '@app/shared/components/button/Button'
import Text from '@app/shared/components/text/Text'
import { Theme, useTheme } from '@app/shared/theme'
import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

const BORDER_RADIUS = 12

interface OverlayCardProps {
  children: React.ReactNode
  title?: string
  onClose?: () => void
  scrollable?: boolean
  inset?: 'none' | 'sm' | 'md' | 'lg'
}

/**
 * Centered overlay card with optional header and content wrapper.
 * Use this for small, focused interactions like forms, confirmations, or settings.
 */
function OverlayCard(props: OverlayCardProps) {
  const { children, title, onClose, scrollable = false, inset = 'md' } = props
  const { styles, theme } = useTheme(createStyles)

  const insetValue = theme.tokens.inset[inset]
  const ContentContainer = scrollable ? ScrollView : View
  const contentProps = scrollable
    ? { contentContainerStyle: [styles.scrollContent, { paddingHorizontal: insetValue }] }
    : { style: [styles.content, { paddingHorizontal: insetValue }] }

  return (
    <View style={styles.dialog}>
      {(title || onClose) && (
        <View style={styles.header}>
          <View style={styles.headerLeading} />
          <View style={styles.headerTitle}>
            {title && <Text variant='title'>{title}</Text>}
          </View>
          <View style={styles.headerTrailing}>
            {onClose && <Button icon="close" variant='secondary' onPress={onClose} />}
          </View>
        </View>
      )}
      <ContentContainer {...contentProps}>
        {children}
      </ContentContainer>
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  dialog: {
    marginHorizontal: theme.tokens.inset.md,
    borderRadius: BORDER_RADIUS,
    backgroundColor: theme.colors.surface,
    alignSelf: 'center',
    maxWidth: 500,
    position: 'absolute',
    top: '20%',
    left: theme.tokens.inset.md,
    right: theme.tokens.inset.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: theme.dimensions.HEADER_HEIGHT,
    paddingHorizontal: theme.tokens.inset.md,
  },
  headerLeading: {
    minWidth: 44,
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTrailing: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
})

export default OverlayCard
