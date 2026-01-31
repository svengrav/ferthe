import { memo, useState } from 'react'
import { Pressable, View } from 'react-native'
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import { Icon } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'

import { useMapScannerAnimation } from '../hooks/useMapScannerAnimation'
import { useMapDevice, useMapScanner, useMapViewport } from '../stores/mapStore'
import { useMapTheme } from '../stores/mapThemeStore'
import { mapUtils } from '../utils/geoToScreenTransform'

// Animation timing constants
const BUTTON_PADDING = 8
const BUTTON_BORDER_RADIUS = 8
const BUTTON_SCALE_MIN = 0.95
const BUTTON_SCALE_RANGE = 0.05
const COOLDOWN_FADE_DURATION = 200
const COOLDOWN_RECOVERY_DURATION = 5000
const COOLDOWN_TOTAL_DURATION = 5200
const CONTROL_BOTTOM_OFFSET = 10
const CONTROL_Z_INDEX = 100

/**
 * Scanner circle that visualizes the scan radius on the map
 * Uses viewport boundary from store to ensure correct scaling
 */
function MapScanner() {
  const device = useMapDevice()
  const viewport = useMapViewport()
  const { radius } = useMapScanner()
  const mapTheme = useMapTheme()

  // Calculate scanner position and size
  const point = mapUtils.coordinatesToPosition(device.location, viewport.boundary, viewport.size)
  const width = mapUtils.calculateCircleDimensions(device.location, radius, viewport.boundary, viewport.size).width

  const { animatedStyle } = useMapScannerAnimation({
    point,
    width,
    style: {
      fill: mapTheme.scanner.fill,
      strokeColor: mapTheme.scanner.strokeColor,
      strokeWidth: mapTheme.scanner.strokeWidth,
    },
  })

  return <Animated.View style={animatedStyle} />
}

interface MapScannerControlProps {
  startScan: () => void
}

/**
 * Control button for triggering manual scans with cooldown animation
 */
function MapScannerControl(props: MapScannerControlProps) {
  const { startScan } = props
  const { styles, theme, context } = useApp(useStyles)
  const [isOnCooldown, setIsOnCooldown] = useState(false)
  const colorProgress = useSharedValue(1)

  const derivedColor = theme.deriveColor(theme.colors.primary, 0.8)

  // Animated button style with color and scale transitions
  const animatedButtonStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(colorProgress.value, [0, 1], [derivedColor, theme.colors.primary])

    return {
      backgroundColor,
      padding: BUTTON_PADDING,
      borderRadius: BUTTON_BORDER_RADIUS,
      transform: [{ scale: BUTTON_SCALE_MIN + colorProgress.value * BUTTON_SCALE_RANGE }],
    }
  })

  const handleStartScan = () => {
    if (isOnCooldown) return

    setIsOnCooldown(true)

    // Fade out animation
    colorProgress.value = withTiming(0, { duration: COOLDOWN_FADE_DURATION })

    startScan()

    // Fade in animation (delayed)
    setTimeout(() => {
      colorProgress.value = withTiming(1, { duration: COOLDOWN_RECOVERY_DURATION })
    }, COOLDOWN_FADE_DURATION)

    // Reset cooldown state
    setTimeout(() => {
      setIsOnCooldown(false)
    }, COOLDOWN_TOTAL_DURATION)
  }

  return (
    <View style={styles?.controlsContainer}>
      <Animated.View style={animatedButtonStyle}>
        <Pressable onPress={handleStartScan} disabled={isOnCooldown}>
          <Icon name="sensors" />
        </Pressable>
      </Animated.View>
    </View>
  )
}

const useStyles = createThemedStyles(() => ({
  controlsContainer: {
    zIndex: CONTROL_Z_INDEX,
    position: 'absolute',
    bottom: CONTROL_BOTTOM_OFFSET,
  },
}))

const MemoizedMapScanner = memo(MapScanner)
export { MemoizedMapScanner as MapScanner, MapScannerControl }
