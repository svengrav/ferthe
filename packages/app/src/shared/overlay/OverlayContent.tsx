import { IconButton, Text } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import React from 'react'
import { View } from 'react-native'

// Content styling constants
const BORDER_RADIUS = 12
const CONTENT_PADDING = 16

interface OverlayContentProps {
  title?: string
  onClose?: () => void
  closable?: boolean
  children: React.ReactNode
}

/**
 * Standardized overlay content wrapper with title, close button, and styled container
 */
function OverlayContent({
  title,
  onClose,
  closable = true,
  children
}: OverlayContentProps) {
  const { styles } = useApp(useStyles)

  if (!styles) {
    return null
  }

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
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
}))

export default OverlayContent
