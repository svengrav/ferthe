import { useTrails } from '@app/features/trail/stores/trailStore'
import { Stack, Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { closeOverlay, OverlayCard, setOverlay, useOverlayStore } from '@app/shared/overlay'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { logger } from '@app/shared/utils/logger'
import { useState } from 'react'
import CommunityEditor from './CommunityEditor'

export function useCommunityUpdaterCard() {
  return {
    showCommunityUpdaterCard: (props: CommunityUpdaterCardProps) => setOverlay('community-updater-card', <CommunityUpdaterCard {...props} onClose={() => closeOverlay('community-updater-card')} />),
    closeCommunityUpdaterCard: () => closeOverlay('community-updater-card')
  }
}


/**
 * Hook for managing community editing.
 * Handles loading state and update logic.
 */
function useCommunityUpdater(communityId: string) {
  const { communityApplication } = getAppContextStore()
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
    useOverlayStore.getState().removeByKey('community-updater-card')
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
  const { locales } = useLocalization()
  const { handleUpdate } = useCommunityUpdater(communityId)

  return (
    <OverlayCard onClose={onClose}>
      <Stack spacing="lg">
        <Text variant="heading">{locales.community.editCommunity}</Text>
        <CommunityEditor
          trails={trails}
          initialData={initialData}
          onSubmit={handleUpdate}
        />
      </Stack>
    </OverlayCard>
  )
}
