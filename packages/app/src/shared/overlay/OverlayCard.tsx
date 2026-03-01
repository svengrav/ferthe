import Button from '@app/shared/components/button/Button'
import Text from '@app/shared/components/text/Text'
import { Theme, useTheme } from '@app/shared/theme'
import React from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'


interface OverlayCardProps {
  children: React.ReactNode
  title?: string
  onClose?: () => void
  scrollable?: boolean
  inset?: 'none' | 'sm' | 'md' | 'lg'
  keyboardAware?: boolean
}

/**
 * Centered overlay card with optional header and content wrapper.
 * Use this for small, focused interactions like forms, confirmations, or settings.
 */
function OverlayCard(props: OverlayCardProps) {
  const { children, title, onClose, scrollable = false, inset = 'md', keyboardAware = false } = props
  const { styles, theme } = useTheme(createStyles)

  const insetValue = theme.tokens.inset[inset]
  const ContentContainer = scrollable ? ScrollView : View
  const contentProps = scrollable
    ? { contentContainerStyle: [styles.scrollContent, { paddingHorizontal: insetValue }], keyboardShouldPersistTaps: 'handled' as const }
    : { style: [styles.content, { paddingHorizontal: insetValue }] }

  const cardContent = (
    <View style={styles.container}>
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

  if (keyboardAware) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        {cardContent}
      </KeyboardAvoidingView>
    )
  }

  return cardContent
}


const createStyles = (theme: Theme) => StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    marginHorizontal: theme.tokens.inset.md,
    borderRadius: theme.tokens.borderRadius.md,
    backgroundColor: theme.colors.surface,
    alignSelf: 'center',
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: "-50%" }],
    left: theme.tokens.inset.md,
    right: theme.tokens.inset.md,
    padding: theme.tokens.inset.sm
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: theme.dimensions.HEADER_HEIGHT - 10,
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
