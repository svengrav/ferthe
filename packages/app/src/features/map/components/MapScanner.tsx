import { Icon } from '@app/shared/components'
import { Theme, useThemeStore } from '@app/shared/theme'
import { memo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useMapScannerAnimation } from '../hooks/useMapScannerAnimation'
import { useMapBoundary, useMapCanvas, useMapDevice, useMapScanner } from '../stores/mapStore'
import { useMapTheme } from '../stores/mapThemeStore'
import { mapUtils } from '../utils/geoToScreenTransform.'


function MapScanner() {
  const device = useMapDevice()
  const { size } = useMapCanvas()
  const boundary = useMapBoundary()
  const { radius } = useMapScanner()
  const mapTheme = useMapTheme()

  const point = mapUtils.coordinatesToPosition(device.location, boundary, size)
  const width = mapUtils.calculateCircleDimensions(device.location, radius, boundary, size).width
  const { animatedStyle } = useMapScannerAnimation({
    point, width, style: {
      fill: mapTheme.scanner.fill,
      strokeColor: mapTheme.scanner.strokeColor,
      strokeWidth: mapTheme.scanner.strokeWidth,
    }
  })
  return <Animated.View style={animatedStyle} />
}

const MapScannerControl = ({ startScan }: { startScan: () => void }) => {
  const [isOnCooldown, setIsOnCooldown] = useState(false)
  const theme = useThemeStore()
  const styles = createStyles(theme)
  const colorProgress = useSharedValue(1)

  const derivedColor = theme.deriveColor(theme.colors.primary, 0.8)

  const animatedButtonStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      colorProgress.value,
      [0, 1],
      [derivedColor, theme.colors.primary]
    )

    return {
      backgroundColor,
      padding: 8,
      borderRadius: 8,
      transform: [{ scale: 0.95 + (colorProgress.value * 0.05) }],
    }
  })

  const handleStartScan = () => {
    if (isOnCooldown) return

    setIsOnCooldown(true)

    colorProgress.value = withTiming(0, { duration: 200 })

    startScan()

    setTimeout(() => {
      colorProgress.value = withTiming(1, {
        duration: 5000
      })
    }, 200)

    setTimeout(() => {
      setIsOnCooldown(false)
    }, 5200)
  }

  return (
    <View style={styles.controlsContainer}>
      <Animated.View style={animatedButtonStyle}>
        <Pressable onPress={handleStartScan} disabled={isOnCooldown}>
          <Icon name="sensors" />
        </Pressable>
      </Animated.View>
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  buttonText: {
    color: theme.colors.surface,
    fontSize: 16,
    textAlign: 'center',
  },
  controlsContainer: {
    zIndex: 100,
    position: 'absolute',
    bottom: 10, // Constant!
  },
})

const MemoizedMapScanner = memo(MapScanner)
export { MemoizedMapScanner as MapScanner, MapScannerControl }
