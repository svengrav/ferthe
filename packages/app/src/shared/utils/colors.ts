/**
 * Convert a hex color string to an RGBA string with a given intensity.
 * @param hex Hex color string (e.g. "#ff5733")
 * @param intensity Intensity value (0.1 - 1)
 * @returns RGBA color string
 */
const hexToRgbaWithIntensity = (hex: string, intensity: number): string => {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.slice(0, 2), 16)
  const g = parseInt(cleanHex.slice(2, 4), 16)
  const b = parseInt(cleanHex.slice(4, 6), 16)
  const alpha = Math.min(1, intensity)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export { hexToRgbaWithIntensity }
