import { Button, Dropdown, Text } from '@app/shared/components'
import { useRemoveDialog } from '@app/shared/components/dialog/Dialog'
import { useLocalization } from '@app/shared/localization'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'
import { UpsertStoryRequest } from '@shared/contracts'
import { useState } from 'react'
import { Animated, View } from 'react-native'
import { useStory } from '../stores/storyStore'
import { useStoryEditor } from './StoryEditor'
import StoryCard from './StoryCard'

interface StoryUserContentSectionProps {
  storyContextId: string
  onSave: (data: UpsertStoryRequest) => Promise<boolean>
  onDelete: (storyId: string) => Promise<boolean>
}

/**
 * Renders the user story section: shows Add button or existing story with edit/delete.
 * The parent is responsible for loading the story into the store before rendering.
 */
function StoryUserContentSection({ storyContextId, onSave, onDelete }: StoryUserContentSectionProps) {
  const { styles } = useTheme(useStyles)
  const { locales } = useLocalization()
  const story = useStory(storyContextId)
  const { showStoryEditor, closeStoryEditor } = useStoryEditor()
  const { openDialog, closeDialog } = useRemoveDialog()
  const [isLoading, setIsLoading] = useState(false)

  if (!storyContextId || !styles) return null

  const showEditor = () => {
    showStoryEditor(storyContextId, story, async (data) => {
      setIsLoading(true)
      const success = await onSave(data)
      if (success) closeStoryEditor(storyContextId)
      setIsLoading(false)
    })
  }

  const handleDelete = () => {
    if (!story) return
    openDialog({
      onConfirm: async () => {
        closeDialog()
        setIsLoading(true)
        await onDelete(story.id)
        setIsLoading(false)
      },
      onCancel: closeDialog,
    })
  }

  const renderAddContent = () => (
    <Button
      label={locales.discovery.addNote}
      variant='outlined'
      style={styles.addContentLink}
      onPress={showEditor}
    />
  )

  return (
    <View>
      <Text variant='heading' size='md'>Your Story</Text>
      {story ? <StoryCard story={story} trailing={
        <Button variant='outlined' icon='more-vert' options={[
          { label: locales.common.edit, onPress: showEditor },
          { label: locales.common.delete, onPress: handleDelete },
        ]} />

      } /> : renderAddContent()}
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  userContent: {
    flex: 1,
    padding: theme.tokens.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: 8,
    gap: 12,
  },
  userComment: {
    color: theme.colors.onSurface,
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
  },
  addContentLink: {
    color: theme.colors.primary,
    textAlign: 'center',
    paddingVertical: 8,
  },
}))

export default StoryUserContentSection
