import { useCallback, useEffect, useState } from 'react'
import { scheduleOnRN } from 'react-native-worklets'

// Scale compensation limits
const MIN_COMPENSATED = 0.8
const MAX_COMPENSATED = 2.5
const DAMPENING = 0.4
const BASE_MULTIPLIER = 1.5
const RATIO_MULTIPLIER = 2

interface CompensatedScaleConfig {
  canvasSize: { width: number; height: number }
  screenSize: { width: number; height: number }
}

/**
 * Hook for calculating compensated scale for child elements in Overview mode
 * Ensures spots, clues, and device markers remain visible at different zoom levels
 */
export const useOverlayCompensatedScale = (config: CompensatedScaleConfig) => {
  const { canvasSize, screenSize } = config
  const [compensatedScale, setCompensatedScale] = useState(1)

  const calculateCompensatedScale = useCallback((zoomScale: number) => {
    const canvasToScreenRatio = Math.min(
      canvasSize.width / screenSize.width,
      canvasSize.height / screenSize.height
    )

    // Better baseline for small trails
    const baseCompensation = (1 / zoomScale) * Math.max(BASE_MULTIPLIER, RATIO_MULTIPLIER / canvasToScreenRatio)
    const compensated = 1 + (baseCompensation - 1) * DAMPENING

    setCompensatedScale(Math.max(MIN_COMPENSATED, Math.min(MAX_COMPENSATED, compensated)))
  }, [canvasSize.width, canvasSize.height, screenSize.width, screenSize.height])

  // Initialize on mount and canvas size changes
  useEffect(() => {
    calculateCompensatedScale(1)
  }, [calculateCompensatedScale])

  // Wrapper for worklet calls
  const onScaleChange = useCallback((newScale: number) => {
    scheduleOnRN(() => calculateCompensatedScale(newScale))
  }, [calculateCompensatedScale])

  return { compensatedScale, onScaleChange }
}
