import { useCallback, useEffect, useState } from 'react'
import { scheduleOnRN } from 'react-native-worklets'

// Scale compensation limits (unified with Map component)
const MIN_COMPENSATED = 0.6
const MAX_COMPENSATED = 1.8
const COMPENSATION_FACTOR = 1.2
const DAMPENING = 0.7

interface CompensatedScaleConfig {
  canvasSize: { width: number; height: number }
  screenSize: { width: number; height: number }
}

/**
 * Hook for calculating compensated scale for child elements in Overview mode
 * Ensures spots, clues, and device markers remain visible at different zoom levels
 * Uses same algorithm as Map component for consistency
 */
export const useOverlayCompensatedScale = (config: CompensatedScaleConfig) => {
  const [compensatedScale, setCompensatedScale] = useState(1)

  const calculateCompensatedScale = useCallback((zoomScale: number) => {
    // Unified algorithm: same as Map's useCompensatedScale
    const baseCompensation = (1 / zoomScale) * COMPENSATION_FACTOR
    const compensated = 1 + (baseCompensation - 1) * DAMPENING

    setCompensatedScale(Math.max(MIN_COMPENSATED, Math.min(MAX_COMPENSATED, compensated)))
  }, [])

  // Initialize on mount and canvas size changes
  useEffect(() => {
    calculateCompensatedScale(1)
  }, [calculateCompensatedScale])

  // Wrapper for worklet calls
  const onScaleChange = useCallback((newScale: number) => {
    scheduleOnRN(calculateCompensatedScale, newScale)
  }, [calculateCompensatedScale])

  return { compensatedScale, onScaleChange }
}
