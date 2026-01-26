import { memo, useEffect, useState } from 'react'
import { View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'

import { Icon, Text } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'

import { useZoomMode } from '../stores/mapStore'

// Animation timing
const SHOW_DURATION = 200
const HIDE_DURATION = 300
const DISPLAY_TIME = 1500
const CLEANUP_DELAY = DISPLAY_TIME + HIDE_DURATION

/**
 * Hook for indicator visibility and animations
 */
const useIndicatorAnimation = (zoomMode: string) => {
  const [showIndicator, setShowIndicator] = useState(false)
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)

  useEffect(() => {
    // Show with animation
    setShowIndicator(true)
    opacity.value = withTiming(1, { duration: SHOW_DURATION })
    scale.value = withSpring(1, { damping: 15 })

    // Hide after display time
    const hideTimer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: HIDE_DURATION })
      scale.value = withTiming(0.8, { duration: HIDE_DURATION })
    }, DISPLAY_TIME)

    // Cleanup state after animation
    const cleanupTimer = setTimeout(() => {
      setShowIndicator(false)
    }, CLEANUP_DELAY)

    return () => {
      clearTimeout(hideTimer)
      clearTimeout(cleanupTimer)
    }
  }, [zoomMode])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  return { showIndicator, animatedStyle }
}

/**
 * Visual indicator for zoom mode transitions
 * Shows NAV/OVERVIEW mode briefly during transitions
 */
function MapZoomModeIndicator() {
  const { styles } = useApp(useStyles)
  const zoomMode = useZoomMode()
  const { showIndicator, animatedStyle } = useIndicatorAnimation(zoomMode)

  if (!showIndicator) return null

  const isNavMode = zoomMode === 'NAV'
  const modeLabel = isNavMode ? 'Navigation' : 'Übersicht'
  const iconName = isNavMode ? 'navigation' : 'map'

  return (
    <Animated.View style={[styles?.container, animatedStyle]}>
      <View style={styles?.content}>
        <Icon name={iconName} size={20} />
        <Text style={styles?.label}>{modeLabel}</Text>
      </View>
    </Animated.View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'none',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.deriveColor(theme.colors.surface, 0.95),
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
}))

export default memo(MapZoomModeIndicator)
