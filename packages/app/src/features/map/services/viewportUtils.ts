/**
 * Calculate minimum scale to prevent viewport from being smaller than container
 * 
 * @param containerSize - Available screen space
 * @param viewportSize - Viewport dimensions
 * @returns Minimum scale value to fill container
 */
export const calculateMinScale = (
  containerSize: { width: number; height: number },
  viewportSize: { width: number; height: number }
): number => {
  const scaleX = containerSize.width / viewportSize.width
  const scaleY = containerSize.height / viewportSize.height

  // Use max to ensure viewport fills container in both dimensions
  return Math.max(scaleX, scaleY)
}

/**
 * Calculate scale needed to display a desired radius within viewport
 * 
 * @param viewportRadius - Actual viewport geo-radius in meters
 * @param desiredRadius - Desired visible radius in meters
 * @returns Scale value to achieve desired visible area
 * 
 * @example
 * // Viewport shows 1500m, but want to see only 500m initially
 * calculateScaleForRadius(1500, 500) // => 3 (zoom in 3x)
 * 
 * // Viewport shows 500m, but want to see 1000m
 * calculateScaleForRadius(500, 1000) // => 0.5 (zoom out 2x)
 */
export const calculateScaleForRadius = (
  viewportRadius: number,
  desiredRadius: number
): number => {
  if (desiredRadius <= 0) return 1
  return viewportRadius / desiredRadius
}
