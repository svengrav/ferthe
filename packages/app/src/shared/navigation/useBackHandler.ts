import { useEffect } from 'react'
import { BackHandler } from 'react-native'

/**
 * Hook to handle Android hardware back button press
 * @param handler Function to handle back press. Return true to prevent default behavior, false to allow it
 * @param enabled Whether the handler should be active
 */
export const useBackHandler = (handler: () => boolean, enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handler)

    return () => backHandler.remove()
  }, [handler, enabled])
}
