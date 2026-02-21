import { useTrails } from '@app/features/trail/stores/trailStore'
import { Stack, Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization/'
import { OverlayCard } from '@app/shared/overlay'
import { closeOverlay, setOverlay } from '@app/shared/overlay/'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { useState } from 'react'
import CommunityEditor from './CommunityEditor'

export function useCommunityCreatorCard() {
  return {
    showCommunityCreatorCard: () => setOverlay('community-creator-card', <CommunityCreatorCard onClose={() => closeOverlay('community-creator-card')} />),
    closeCommunityCreatorCard: () => closeOverlay('community-creator-card')
  }
}

/**
 * Hook for managing community creation.
 * Handles loading state and creation logic.
 */
function useCommunityCreator() {
  const { communityApplication } = getAppContextStore()
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async (data: { name: string; trailId: string }) => {
    setIsCreating(true)
    const result = await communityApplication.createCommunity({
      name: data.name.trim(),
      trailIds: [data.trailId]
    })
    setIsCreating(false)

    if (result.success) {
      closeOverlay('community-creator-card')
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
interface CommunityCreatorCardProps {
  onClose?: () => void
}

export function CommunityCreatorCard({ onClose }: CommunityCreatorCardProps) {
  const trails = useTrails()
  const { locales } = useLocalization()
  const { handleCreate } = useCommunityCreator()

  return (
    <OverlayCard title='Create Community' onClose={onClose}>
      <Stack spacing="lg">
        <Text variant="heading">{locales.community.createNewCommunity}</Text>
        <CommunityEditor trails={trails} onSubmit={handleCreate} />
      </Stack>
    </OverlayCard>
  )
}
