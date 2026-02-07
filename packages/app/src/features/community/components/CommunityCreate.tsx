import { getAppContext } from '@app/appContext'
import { useTrails } from '@app/features/trail/stores/trailStore'
import { Stack, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { useOverlayStore } from '@app/shared/overlay'
import { closeOverlay, setOverlay } from '@app/shared/overlay/'
import { useState } from 'react'
import CommunityEditor from './CommunityEditor'

export function useCommunityCreateOverlay() {
  return {
    open: () => setOverlay('dialog', <CommunityCreate />, { variant: 'compact', title: 'Create Community', closable: true, inset: 'md' }),
    close: () => closeOverlay('dialog')
  }
}

/**
 * Hook for managing community creation.
 * Handles loading state and creation logic.
 */
function useCommunityCreate() {
  const { communityApplication } = getAppContext()
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async (data: { name: string; trailId: string }) => {
    setIsCreating(true)
    const result = await communityApplication.createCommunity({
      name: data.name.trim(),
      trailIds: [data.trailId]
    })
    setIsCreating(false)

    if (result.success) {
      useOverlayStore.getState().removeByKey('communityCreate')
    }
  }

  return {
    handleCreate,
    isCreating,
  }
}

/**
 * Wrapper component for creating a new community.
 * Contains heading and form for community creation.
 */
export function CommunityCreate() {
  const trails = useTrails()
  const { t } = useLocalizationStore()
  const { handleCreate } = useCommunityCreate()

  return (
    <Stack spacing="lg">
      <Text variant="heading">{t.community.createNewCommunity}</Text>
      <CommunityEditor trails={trails} onSubmit={handleCreate} />
    </Stack>
  )
}
