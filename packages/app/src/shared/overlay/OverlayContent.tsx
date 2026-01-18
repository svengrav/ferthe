import { IconButton, PageHeader, Text } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import React from 'react'
import { ScrollView, View } from 'react-native'
import { Option } from '../components/types'

// Content styling constants
const BORDER_RADIUS = 12
const CONTENT_PADDING = 16

export type OverlayVariant = 'compact' | 'fullscreen' | 'page'

interface OverlayContentProps {
  title?: string
  onClose?: () => void
  closable?: boolean
  children: React.ReactNode
  variant?: OverlayVariant
  options?: Option[]
  scrollable?: boolean
}

/**
 * Standardized overlay content wrapper with title, close button, and styled container
 * Supports multiple variants: compact (centered modal), fullscreen (default), page (with PageHeader)
 */
function OverlayContent({
  title,
  onClose,
  closable = true,
  children,
  variant = 'fullscreen',
  options,
  scrollable = false
}: OverlayContentProps) {
  const { styles } = useApp(useStyles)

  if (!styles) {
    return null
  }

  // Compact variant - centered modal with rounded corners
  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        {/* Header with title and close button */}
        {(title || closable) && (
          <View style={styles.compactHeader}>
            {title && <Text style={styles.compactTitle}>{title}</Text>}
            {closable && (
              <IconButton
                name="close"
                variant="outlined"
                onPress={onClose}
                size={20}
              />
            )}
          </View>
        )}
        {/* Content area */}
        <View style={styles.compactContent}>{children}</View>
      </View>
    )
  }

  // Page variant - fullscreen with PageHeader
  if (variant === 'page') {
    const ContentContainer = scrollable ? ScrollView : View
    const contentProps = scrollable 
      ? { contentContainerStyle: styles.pageScrollContent } 
      : { style: styles.pageContent }
    
    return (
      <View style={styles.pageContainer}>
        <PageHeader
          label={title}
          options={options}
          action={<IconButton onPress={onClose} name='arrow-back' variant='outlined' size={24} />}
        />
        <ContentContainer {...contentProps}>
          {children}
        </ContentContainer>
      </View>
    )
  }

  // Default fullscreen variant
  return (
    <View style={styles.container}>
      {/* Header with title and close button */}
      {(title || closable) && (
        <View style={styles.header}>
          {title && (
            <Text style={styles.title}>
              {title}
            </Text>
          )}
          {closable && (
            <IconButton
              name="close"
              variant="outlined"
              onPress={onClose}
              style={{ marginRight: -8 }}
            />
          )}
        </View>
      )}

      {/* Content area */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  // Fullscreen variant (default)
  container: {
    flex: 1,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: theme.constants.HEADER_HEIGHT,
    paddingHorizontal: CONTENT_PADDING,
    backgroundColor: theme.deriveColor(theme.colors.surface, 0.2),
    paddingVertical: CONTENT_PADDING / 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.onSurface + '20',
  },
  title: {
    ...theme.text.size.sm,
    color: theme.colors.onSurface,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: CONTENT_PADDING,
  },
  
  // Compact variant - centered modal
  compactContainer: {
    flex:1,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  compactTitle: {
    ...theme.text.size.lg,
    color: theme.colors.onSurface,
  },
  compactContent: {
    gap: 12,
    padding: 8,
    borderRadius: 8,
  },
  
  // Page variant - fullscreen with PageHeader
  pageContainer: {
    flex: 1,
  },
  pageContent: {
    flex: 1,
  },
  pageScrollContent: {
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
}))

export default OverlayContent
