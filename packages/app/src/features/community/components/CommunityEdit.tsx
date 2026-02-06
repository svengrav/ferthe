import { getAppContext } from '@app/appContext'
import { useTrails } from '@app/features/trail/stores/trailStore'
import { Stack, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { closeOverlay, setOverlay, useOverlayStore } from '@app/shared/overlay'
import { logger } from '@app/shared/utils/logger'
import { useState } from 'react'
import CommunityEditor from './CommunityEditor'



export function useCommunityUpdateOverlay(props: CommunityUpdateProps) {
  return {
    open: () => setOverlay('communityEdit', <CommunityUpdate {...props} />, { variant: 'compact' }),
    close: () => closeOverlay('communityEdit')
  }
}

interface CommunityUpdateProps {
  communityId: string
  initialData: { name: string; trailId: string }
}

/**
 * Hook for managing community editing.
 * Handles loading state and update logic.
 */
function useCommunityEdit(communityId: string) {
  const { communityApplication } = getAppContext()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async (data: { name: string; trailId: string }) => {
    setIsUpdating(true)
    logger.log(`Update community not yet implemented: ${communityId}`)
    // TODO: Implement update functionality when API is ready
    // const result = await communityApplication.updateCommunity(communityId, {
    //   name: data.name.trim(),
    //   trailIds: [data.trailId]
    // })
    setIsUpdating(false)
    useOverlayStore.getState().removeByKey('communityEdit')
  }

  return {
    handleUpdate,
    isUpdating,
  }
}

/**
 * Wrapper component for editing an existing community.
 * Contains heading and form for community editing.
 */
export function CommunityUpdate({ communityId, initialData }: CommunityUpdateProps) {
  const trails = useTrails()
  const { t } = useLocalizationStore()
  const { handleUpdate } = useCommunityEdit(communityId)

  return (
    <Stack spacing="lg">
      <Text variant="heading">{t.community.editCommunity}</Text>
      <CommunityEditor
        trails={trails}
        initialData={initialData}
        onSubmit={handleUpdate}
      />
    </Stack>
  )
}
