import { useCallback, useEffect } from 'react'
import { Platform } from 'react-native'
import { SharedValue, withSpring } from 'react-native-reanimated'

const WEB_ZOOM_OUT = 0.8
const WEB_ZOOM_IN = 1.2

const SPRING_CONFIG = {
  damping: 10,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: false,
}

interface UseMapWheelZoomOptions {
  scale: SharedValue<number>
  translationX?: SharedValue<number>
  translationY?: SharedValue<number>
  minScale: number
  maxScale: number
  elementId: string
  onBoundsUpdate: () => void
}

/**
 * Hook for mouse wheel zoom support (web only, dev/test purposes)
 * Separated from main gesture logic for clarity
 */
export const useMapWheelZoom = ({ scale, translationX, translationY, minScale, maxScale, elementId, onBoundsUpdate }: UseMapWheelZoomOptions) => {
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault()
      const zoomFactor = event.deltaY > 0 ? WEB_ZOOM_OUT : WEB_ZOOM_IN
      const newScale = scale.value * zoomFactor

      if (newScale >= minScale && newScale <= maxScale) {
        scale.value = withSpring(newScale, SPRING_CONFIG)

        // Reset translation immediately after zoom to prevent viewport shift
        if (translationX) translationX.value = 0
        if (translationY) translationY.value = 0

        onBoundsUpdate()
      }
    },
    [minScale, maxScale, onBoundsUpdate, translationX, translationY]
  )

  useEffect(() => {
    if (Platform.OS !== 'web') return

    const bindWheelEvent = () => {
      const element = document.getElementById(elementId)
      if (!element) {
        // Retry after delay if element not found
        const timeoutId = setTimeout(bindWheelEvent, 100)
        return () => clearTimeout(timeoutId)
      }

      element.addEventListener('wheel', handleWheel, { passive: false })
      return () => element.removeEventListener('wheel', handleWheel)
    }

    return bindWheelEvent()
  }, [elementId, handleWheel])
}
