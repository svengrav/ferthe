import { createThemedStyles } from '@app/shared/theme'
import { useApp, useAppDimensions } from '@app/shared/useApp'
import React, { useEffect, useRef } from 'react'
import { Animated, TouchableOpacity, View } from 'react-native'
import { hexToRgbaWithIntensity } from '../utils/colors'
import { useOverlayStore } from './useOverlayStore'

// Animation constants
const FADE_IN_DURATION = 300
const FADE_OUT_DURATION = 200
const SCALE_TENSION = 100
const SCALE_FRICTION = 8
const INITIAL_SCALE = 0.9
const FINAL_SCALE = 1
const OVERLAY_Z_INDEX = 1000
const OVERLAY_PADDING = 16

/**
 * Hook to manage overlay animation logic
 */
const useOverlayAnimation = (visible: boolean) => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(INITIAL_SCALE)).current
  const [shouldRender, setShouldRender] = React.useState(visible)

  useEffect(() => {
    if (visible) {
      setShouldRender(true)
      // Fade in and scale up animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: FADE_IN_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: FINAL_SCALE,
          tension: SCALE_TENSION,
          friction: SCALE_FRICTION,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      // Fade out and scale down animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: FADE_OUT_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: INITIAL_SCALE,
          duration: FADE_OUT_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false)
      })
    }
  }, [visible, fadeAnim, scaleAnim])

  return { fadeAnim, scaleAnim, shouldRender }
}

/**
 * Provider component that renders all active overlays from the store
 */
function OverlayProvider() {
  const overlayStore = useOverlayStore()

  if (overlayStore.overlays?.length > 0) {
    return overlayStore.overlays.map((overlayItem) => (
      <OverlayContainer
        key={overlayItem.id}
        visible
        transparent={overlayItem.settings?.transparent}
        closeOnBackdropPress={overlayItem.settings?.closeOnBackdropPress}
      >
        {overlayItem.overlay}
      </OverlayContainer>
    ))
  }
  return null
}


interface OverlayContainerProps {
  visible: boolean
  onClose?: () => void
  children: React.ReactNode
  transparent?: boolean
  closeOnBackdropPress?: boolean
}

/**
 * Plain overlay container with animation and backdrop - no styling or content wrapper
 */
function OverlayContainer({
  visible,
  onClose,
  children,
  transparent = true,
  closeOnBackdropPress = true
}: OverlayContainerProps) {
  const { styles, theme } = useApp(useStyles)
  const { fadeAnim, scaleAnim, shouldRender } = useOverlayAnimation(visible)
  const { height, width } = useAppDimensions()
  if (!shouldRender || !styles) {
    return null
  }

  const overlayHeight = height - theme.constants.HEADER_HEIGHT - theme.constants.NAV_HEIGHT + 1
  const overlayTransparency = transparent ? theme.constants.OVERLAY_TRANSPARENCY : 1
  const backgroundColor = hexToRgbaWithIntensity(theme.colors.background, overlayTransparency)
  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: theme.constants.HEADER_HEIGHT,
          height: overlayHeight,
          opacity: fadeAnim,
        }
      ]}
    >
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View
          style={[styles.overlay, { backgroundColor }]}
          pointerEvents="box-none"
        >
          {closeOnBackdropPress && (
            <TouchableOpacity
              style={styles.backdropPress}
              activeOpacity={1}
              onPress={onClose}
            />
          )}
          <View style={styles.contentArea} pointerEvents="auto">
            {children}
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    position: 'absolute',
    overflow: 'hidden',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: OVERLAY_Z_INDEX,
    backgroundColor: theme.colors.background,
  },
  animatedContainer: {
    height: '100%',
    overflow: 'hidden'
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: OVERLAY_PADDING,
  },
  backdropPress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentArea: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
}))

export { OverlayProvider }
export default OverlayContainer