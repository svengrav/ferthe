import Button from '@app/shared/components/button/Button'
import Text from '@app/shared/components/text/Text'
import { Theme, useTheme } from '@app/shared/theme'
import React from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'


interface OverlayCardProps {
  children: React.ReactNode
  title?: string
  onClose?: () => void
  inset?: 'none' | 'sm' | 'md' | 'lg'
  keyboardAware?: boolean
}

/**
 * Centered overlay card with optional header and content wrapper.
 * Use this for small, focused interactions like forms, confirmations, or settings.
 */
function OverlayCard(props: OverlayCardProps) {
  const { children, title, onClose, inset = 'md', keyboardAware = false } = props
  const { styles, theme } = useTheme(createStyles)

  const cardContent =
    <View style={styles.wrapper}>
      <View style={[styles.container, { paddingHorizontal: theme.tokens.inset[inset] }]} id='overlay-card'>
        {(title || onClose) && (
          <View style={[styles.header]} id='overlay-card-header'>
            {/* <View style={styles.headerLeading} /> */}
            <View style={styles.headerTitle}>
              {title && <Text variant='title'>{title}</Text>}
            </View>
            <View style={styles.headerTrailing}>
              {onClose && <Button
                icon="close"
                variant='secondary'
                onPress={onClose}
                style={{ marginRight: inset === 'none' ? 4 : 0 }}
              />}
            </View>
          </View>
        )}
        <ScrollView contentContainerStyle={[styles.scrollContent]} keyboardShouldPersistTaps='handled' id={`overlay-card-content`}>
          {children}
        </ScrollView>
      </View>
    </View>


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
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.tokens.inset.md,
  },
  container: {
    maxHeight: '100%',
    borderRadius: theme.tokens.borderRadius.md,
    backgroundColor: theme.colors.surface
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.tokens.spacing.lg,
    marginBottom: theme.tokens.spacing.sm,
  },
  headerLeading: {
    minWidth: 44,
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
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
