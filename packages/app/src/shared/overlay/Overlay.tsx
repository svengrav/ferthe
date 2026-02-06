import Button from '@app/shared/components/button/Button'
import Text from '@app/shared/components/text/Text'
import { Inset } from '@app/shared/components/types'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import React, { useEffect } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
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

export type OverlayVariant = 'compact' | 'fullscreen'

/**
 * OverlayHeader - Unified header component with slot architecture
 */
interface OverlayHeaderProps {
  leading?: React.ReactNode
  title?: string
  trailing?: React.ReactNode
}

function OverlayHeader({ leading, title, trailing }: OverlayHeaderProps) {
  const { styles } = useApp(useStyles)

  if (!styles) return null

  return (
    <View style={styles.header}>
      <View style={styles.headerLeading}>{leading}</View>
      <View style={styles.headerTitle}>
        {title && <Text variant='title' size='md'>{title}</Text>}
      </View>
      <View style={styles.headerTrailing}>{trailing}</View>
    </View>
  )
}

/**
 * OverlayContent - Unified content component with centralized padding
 */
interface OverlayContentProps {
  children: React.ReactNode
  inset?: Inset
  scrollable?: boolean
  contentInsetY?: 'none' | 'sm' | 'md'
}

function OverlayContent({ children, inset = 'none', scrollable = false, contentInsetY = 'none' }: OverlayContentProps) {
  const { styles, theme } = useApp(useStyles)

  if (!styles) return null

  const insetValue = theme.tokens.inset[inset]
  const verticalInset = contentInsetY !== 'none' ? theme.tokens.spacing[contentInsetY] : 0

  const ContentContainer = scrollable ? ScrollView : View
  const contentProps = scrollable
    ? { contentContainerStyle: [styles.scrollContent, { paddingHorizontal: insetValue, paddingVertical: verticalInset }] }
    : { style: [styles.content, { paddingHorizontal: insetValue, paddingVertical: verticalInset }] }

  return <ContentContainer {...contentProps}>{children}</ContentContainer>
}

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

      const showHeader = settings.title || settings.closable

      return (
        <Overlay
          key={overlayItem.id}
          visible={true}
          onClose={removeOverlay}
          variant={settings.variant === 'page' ? 'fullscreen' : settings.variant}
          closeOnBackdropPress={settings.closeOnBackdropPress}
        >
          {showHeader && (
            <OverlayHeader
              leading={settings.variant === 'fullscreen' ? undefined : <Button onPress={removeOverlay} icon='arrow-back' variant='outlined' size='md' />}
              title={settings.title}
              trailing={settings.closable !== false ? <Button icon="close" variant='secondary' onPress={removeOverlay} /> : undefined}
            />
          )}
          <OverlayContent inset={settings.inset} scrollable={settings.scrollable}>
            {overlayItem.overlay}
          </OverlayContent>
        </Overlay>
      )
    })
  }
  return null
}


interface OverlayProps {
  visible?: boolean
  onClose?: () => void
  variant?: OverlayVariant
  closeOnBackdropPress?: boolean
  children?: React.ReactNode
}

/**
 * Overlay - Backdrop, animation, and layout container with slot architecture
 * Supports compact (centered modal) and fullscreen layouts
 */
function Overlay({
  visible,
  onClose,
  variant = 'fullscreen',
  closeOnBackdropPress = false,
  children
}: OverlayProps) {
  const { styles } = useApp(useStyles)
  const { animatedContainerStyle, shouldRender } = useOverlayAnimation(visible ?? true)
  const insets = useSafeAreaInsets()

  if (!shouldRender || !styles) {
    return null
  }

  const containerStyle = variant === 'compact'
    ? styles.compactContainer
    : styles.fullscreenContainer

  const showBackdrop = variant === 'compact'

  return (
    <Animated.View
      style={[
        styles.container,
        animatedContainerStyle
      ]}
    >
      {showBackdrop && (
        closeOnBackdropPress ? (
          <Pressable style={styles.compactBackdrop} onPress={onClose} />
        ) : (
          <View pointerEvents="none" style={styles.compactBackdrop} />
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
        <View style={containerStyle}>
          {children}
        </View>
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

  // Header component styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: theme.dimensions.HEADER_HEIGHT,
    paddingHorizontal: theme.tokens.inset.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  headerLeading: {
    minWidth: 44,
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTrailing: {
    minWidth: 44,
    alignItems: 'flex-end',
  },

  // Content component styles
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Fullscreen variant
  fullscreenContainer: {
    flex: 1,
    borderRadius: BORDER_RADIUS,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },

  // Compact variant - centered modal
  compactBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.opacity(theme.colors.background, 0.8),
    justifyContent: 'center',
  },
  compactContainer: {
    marginHorizontal: theme.tokens.inset.md,
    borderRadius: BORDER_RADIUS,
    backgroundColor: theme.colors.surface,
    alignSelf: 'center',
    maxWidth: 500,
    position: 'absolute',
    top: '20%',
    left: theme.tokens.inset.md,
    right: theme.tokens.inset.md,
  },
}))

export { OverlayContent, OverlayHeader, OverlayProvider }
export default Overlay