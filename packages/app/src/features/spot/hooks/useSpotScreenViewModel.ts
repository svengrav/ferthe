import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { useEffect, useState } from 'react'
import { useSpots } from '../stores/spotStore'

/**
 * ViewModel hook for SpotScreen.
 * Fetches discovered spots independently of trail state and renders from spotStore.
 */
export function useSpotScreenViewModel() {
  const { discoveryApplication } = getAppContextStore()
  const spots = useSpots()
  const [isLoading, setIsLoading] = useState(false)

  const load = async () => {
    setIsLoading(true)
    await discoveryApplication.requestSpotScreenData()
    setIsLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const toItem = (spot: typeof spots[number]) => ({
    id: spot.id,
    image: spot.image,
    blurredImage: spot.blurredImage,
    title: spot.name,
    isLocked: false,
  })

  const mySpots = spots.filter(s => s.source === 'created').map(toItem)
  const discoveredSpots = spots.filter(s => s.source === 'discovery').map(toItem)

  return {
    mySpots,
    discoveredSpots,
    isLoading,
    refresh: load,
  }
}
