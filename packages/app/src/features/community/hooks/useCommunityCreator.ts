import { getAppContext } from '@app/appContext'
import { useTrails } from '@app/features/trail/stores/trailStore'
import { setOverlay, useOverlayStore } from '@app/shared/overlay'
import { logger } from '@app/shared/utils/logger'
import React, { useCallback, useState } from 'react'
import CommunityCreator from '../components/CommunityCreator'

/**
 * Hook for managing community creation and editing overlay.
 * Provides functions to open the CommunityCreator overlay in create or edit mode.
 */
export function useCommunityCreator() {
  const trails = useTrails()
  const { communityApplication } = getAppContext()
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleCreate = useCallback(async (data: { name: string; trailId: string }) => {
    setIsCreating(true)
    const result = await communityApplication.createCommunity({
      name: data.name.trim(),
      trailIds: [data.trailId]
    })
    setIsCreating(false)

    if (result.success) {
      useOverlayStore.getState().removeByKey('communityCreator')
    }
  }, [communityApplication])

  const handleUpdate = useCallback(async (data: { name: string; trailId: string; communityId: string }) => {
    setIsUpdating(true)
    logger.log(`Update community not yet implemented: ${data.communityId}`)
    // TODO: Implement update functionality when API is ready
    // const result = await communityApplication.updateCommunity(data.communityId, {
    //   name: data.name.trim(),
    //   trailIds: [data.trailId]
    // })
    setIsUpdating(false)
    useOverlayStore.getState().removeByKey('communityCreator')
  }, [])

  const openCommunityForm = useCallback((editData?: { communityId: string; name: string; trailId: string }) => {
    const mode = editData ? 'edit' : 'create'

    setOverlay(
      'communityCreator',
      React.createElement(CommunityCreator, {
        trails,
        mode,
        initialData: editData,
        onCreate: handleCreate,
        onUpdate: handleUpdate,
      }),
      {
        variant: 'compact',
      }
    )
  }, [trails, handleCreate, handleUpdate])

  return {
    openCommunityForm,
    isCreating,
    isUpdating,
  }
}
