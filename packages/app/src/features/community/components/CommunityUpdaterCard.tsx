import { getAppContext } from '@app/appContext'
import { useTrails } from '@app/features/trail/stores/trailStore'
import { Stack, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { closeOverlay, OverlayCard, setOverlay, useOverlayStore } from '@app/shared/overlay'
import { logger } from '@app/shared/utils/logger'
import { useState } from 'react'
import CommunityEditor from './CommunityEditor'

export function useCommunityUpdaterCard() {
  return {
    open: (props: CommunityUpdaterCardProps) => setOverlay('community-updater', <CommunityUpdaterCard {...props} onClose={() => closeOverlay('community-updater')} />),
    close: () => closeOverlay('community-updater')
  }
}


/**
 * Hook for managing community editing.
 * Handles loading state and update logic.
 */
function useCommunityUpdater(communityId: string) {
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
    useOverlayStore.getState().removeByKey('community-updater')
  }

  return {
    handleUpdate,
    isUpdating,
  }
}

interface CommunityUpdaterCardProps {
  communityId: string
  initialData: { name: string; trailId: string }
  onClose?: () => void
}

/**
 * Wrapper component for editing an existing community.
 * Contains heading and form for community editing.
 */
export function CommunityUpdaterCard({ communityId, initialData, onClose }: CommunityUpdaterCardProps) {
  const trails = useTrails()
  const { t } = useLocalizationStore()
  const { handleUpdate } = useCommunityUpdater(communityId)

  return (
    <OverlayCard onClose={onClose}>
      <Stack spacing="lg">
        <Text variant="heading">{t.community.editCommunity}</Text>
        <CommunityEditor
          trails={trails}
          initialData={initialData}
          onSubmit={handleUpdate}
        />
      </Stack>
    </OverlayCard>
  )
}
