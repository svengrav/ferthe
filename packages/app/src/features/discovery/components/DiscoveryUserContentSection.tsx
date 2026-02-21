import { Button, Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'
import { useState } from 'react'
import { Animated, View } from 'react-native'
import { useDiscoveryContent } from '../stores/discoveryContentStore'
import { useDiscoveryContentEditorCard } from './DiscoveryContentEditor'

interface DiscoveryUserContentSectionProps {
  id: string
}

/**
 * Hook to handle content API calls (update, delete)
 */
const useContentActions = (id: string) => {
  const { discoveryApplication } = getAppContextStore()

  const updateContent = async (data: { imageUrl?: string; comment?: string }) => {
    try {
      const result = await discoveryApplication.upsertDiscoveryContent(id, data)
      if (!result.success) {
        logger.error('Failed to save content:', result)
      }
      return result.success
    } catch (error) {
      logger.error('Error saving content:', error)
      return false
    }
  }

  const deleteContent = async () => {
    try {
      const result = await discoveryApplication.deleteDiscoveryContent(id)
      if (!result.success) {
        logger.error('Failed to delete content:', result)
      }
      return result.success
    } catch (error) {
      logger.error('Error deleting content:', error)
      return false
    }
  }

  return { updateContent, deleteContent }
}

/**
 * Renders the user content section with existing content and edit/delete actions,
 * or a link to add new content. Manages content state and overlay interactions.
 */
function DiscoveryUserContentSection({ id }: DiscoveryUserContentSectionProps) {
  const { styles } = useTheme(useStyles)
  const { locales } = useLocalization()
  const content = useDiscoveryContent(id)
  const { updateContent, deleteContent } = useContentActions(id)
  const { showDiscoveryContentEditorCard, closeDiscoveryContentEditorCard } = useDiscoveryContentEditorCard()
  const [isLoading, setIsLoading] = useState(false)

  if (!id || !styles) return null

  // Editor overlay management
  const showEditor = () => {
    showDiscoveryContentEditorCard(id, content, async (data) => {
      setIsLoading(true)
      const success = await updateContent(data)
      if (success) closeDiscoveryContentEditorCard(id)
      setIsLoading(false)
    })
  }

  const handleDeleteContent = async () => {
    setIsLoading(true)
    await deleteContent()
    setIsLoading(false)
  }

  // Content rendering
  const renderAddContent = () => (
    <Button
      label={locales.discovery.addNote}
      variant='outlined'
      style={styles.addContentLink}
      onPress={showEditor}
    />
  )
  const renderContent = () => (
    <View style={styles.userContent}>
      {content.image?.url && (
        <Animated.Image
          source={{ uri: content.image.url }}
          style={styles.userImage}
          resizeMode='cover'
        />
      )}
      {content.comment && (
        <Text style={styles.userComment}>{content.comment}</Text>
      )}
      <View style={styles.actionButtons}>
        <Button
          icon="edit"
          variant="outlined"
          onPress={showEditor}
          disabled={isLoading}
        />
        <Button
          icon="delete"
          variant="outlined"
          onPress={handleDeleteContent}
          disabled={isLoading}
        />
      </View>
    </View>
  )

  return (
    <View>
      <Text variant='heading' size='md'>Notes</Text>
      {content ? renderContent() : renderAddContent()}
    </View>
  )
}


const useStyles = createThemedStyles(theme => ({
  userContentSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  userContent: {
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: 8,
    padding: 12,
    backgroundColor: theme.colors.surface,
    gap: 12,
  },
  userComment: {
    color: theme.colors.onSurface,
    lineHeight: 22,
  },
  userImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  addContentLink: {
    color: theme.colors.primary,
    textAlign: 'center',
    paddingVertical: 8,
  },
}))

export default DiscoveryUserContentSection
