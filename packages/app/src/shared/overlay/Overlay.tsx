import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import React, { useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useOverlayStore } from './useOverlayStore'

// Animation constants
const FADE_IN_DURATION = 300
const FADE_OUT_DURATION = 200
const SCALE_DURATION = 250
const INITIAL_SCALE = 0.95
const FINAL_SCALE = 1
const OVERLAY_Z_INDEX = 1000

// Content styling constants
const BORDER_RADIUS = 12

/**
 * Hook to manage overlay animation logic
 */
const useOverlayAnimation = (visible: boolean) => {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(INITIAL_SCALE)
  const [shouldRender, setShouldRender] = React.useState(visible)

  useEffect(() => {
    if (visible) {
      setShouldRender(true)
      // Fade in and scale up animation
      opacity.value = withTiming(1, { duration: FADE_IN_DURATION })
      scale.value = withTiming(FINAL_SCALE, { duration: SCALE_DURATION })
    } else {
      // Fade out and scale down animation
      opacity.value = withTiming(0, { duration: FADE_OUT_DURATION })
      scale.value = withTiming(INITIAL_SCALE, { duration: FADE_OUT_DURATION }, (finished) => {
        if (finished) {
          setShouldRender(false)
        }
      })
    }
  }, [visible])

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }))

  return { animatedContainerStyle, shouldRender }
}

/**
 * Provider component that renders all active overlays from the store
 */
function OverlayProvider() {
  const overlayStore = useOverlayStore()

  if (overlayStore.overlays?.length > 0) {
    return overlayStore.overlays.map((overlayItem) => {
      const settings = overlayItem.settings || {}
      const removeOverlay = () => overlayStore.remove(overlayItem.id)

      return (
        <Overlay
          key={overlayItem.id}
          visible={true}
          onClose={removeOverlay}
          showBackdrop={settings.showBackdrop}
          closeOnBackdropPress={settings.closeOnBackdropPress}
        >
          {overlayItem.overlay}
        </Overlay>
      )
    })
  }
  return null
}


interface OverlayProps {
  visible?: boolean
  onClose?: () => void
  showBackdrop?: boolean
  closeOnBackdropPress?: boolean
  children?: React.ReactNode
}

/**
 * Overlay - Backdrop und Animation Shell für Overlay-Inhalte.
 * Der Content bestimmt selbst seine Größe und Darstellung.
 */
function Overlay(props: OverlayProps) {
  const { visible, onClose, showBackdrop = false, closeOnBackdropPress = false, children } = props
  const { styles } = useApp(useStyles)
  const { animatedContainerStyle, shouldRender } = useOverlayAnimation(visible ?? true)
  const insets = useSafeAreaInsets()

  if (!shouldRender || !styles) {
    return null
  }

  return (
    <Animated.View
      style={[
        styles.container,
        animatedContainerStyle
      ]}
    >
      {showBackdrop && (
        closeOnBackdropPress ? (
          <Pressable style={styles.backdrop} onPress={onClose} />
        ) : (
          <View pointerEvents="none" style={styles.backdrop} />
        )
      )}
      <View
        style={[
          styles.contentArea,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom
          }
        ]}
        pointerEvents="auto"
      >
        {children}
      </View>
    </Animated.View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: OVERLAY_Z_INDEX,
  },
  contentArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.opacity(theme.colors.background, 0.8),
    justifyContent: 'center',
  },
}))

export { OverlayProvider }
export default Overlay