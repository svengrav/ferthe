import { getAppContext } from '@app/appContext'
import { useEffect } from 'react'
import { useSpot } from '../stores/spotStore'

/**
 * Hook to fetch and manage spot data.
 * Automatically loads spot from API if not in store.
 */
export const useSpotData = (spotId: string) => {
  const spot = useSpot(spotId)
  const { spotApplication } = getAppContext()

  useEffect(() => {
    if (!spot && spotApplication) {
      spotApplication.getSpot(spotId)
    }
  }, [spotId, spot, spotApplication])

  return {
    spot,
    isLoading: !spot,
  }
}
