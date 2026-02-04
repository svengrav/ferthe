import { Button } from '@app/shared/components/'
import PageHeader from '@app/shared/components/page/PageHeader'
import Text from '@app/shared/components/text/Text'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import React, { useEffect } from 'react'
import { ScrollView, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Option } from '../components/types'
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
const CONTENT_PADDING = 16

export type OverlayVariant = 'compact' | 'fullscreen' | 'page'

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
        <OverlayContainer
          key={overlayItem.id}
          visible={true}
          onClose={removeOverlay}
          transparent={settings.transparent}
          variant={settings.variant}
          title={settings.title}
          closable={settings.closable}
          options={settings.options}
          scrollable={settings.scrollable}
        >
          {overlayItem.overlay}
        </OverlayContainer>
      )
    })
  }
  return null
}


interface OverlayContainerProps {
  visible?: boolean
  onClose?: () => void
  children: React.ReactNode
  transparent?: boolean
  closeOnBackdropPress?: boolean
  variant?: OverlayVariant
  title?: string
  closable?: boolean
  options?: Option[]
  scrollable?: boolean
}

/**
 * Overlay container with animation, backdrop, and content variants
 * Supports compact (centered modal), fullscreen (default), and page (with PageHeader) layouts
 */
function OverlayContainer({
  visible,
  onClose,
  children,
  transparent = true,
  variant = 'fullscreen',
  title,
  closable = true,
  options,
  scrollable = false
}: OverlayContainerProps) {
  const { styles, theme } = useApp(useStyles)
  const { animatedContainerStyle, shouldRender } = useOverlayAnimation(visible ?? true)
  const insets = useSafeAreaInsets()

  if (!shouldRender || !styles) {
    return null
  }

  // Render content based on variant
  const renderContent = () => {

    // Compact variant - centered modal with rounded corners
    if (variant === 'compact') {
      return (
        <View key={title} style={{ backgroundColor: theme.opacity(theme.colors.background, 0.8), justifyContent: 'center', alignContent: 'center', paddingTop: 60, flex: 1 }} id='overlay-compact-container'>
          <View style={[styles.compactContainer,]}>
            {/* Header with title and close button */}
            {(title || closable) && (
              <View style={styles.compactHeader}>
                <Text variant='title'>{title}</Text>
                {closable && (
                  <Button
                    icon="close"
                    variant='secondary'
                    onPress={onClose}
                  />
                )}
              </View>
            )}
            {/* Content area */}
            <View style={styles.compactContent} id='overlay-compact-content'>{children}</View>
          </View>
        </View>
      )
    }

    // Page variant - fullscreen with PageHeader
    if (variant === 'page') {
      const ContentContainer = scrollable ? ScrollView : View
      const contentProps = scrollable
        ? { contentContainerStyle: styles.pageScrollContent }
        : { style: styles.pageContent }

      return (
        <View style={styles.pageContainer} id='overlay-page-container'>
          <PageHeader
            label={title}
            options={options}
            action={<Button onPress={onClose} icon='arrow-back' variant='outlined' size='md' />}
          />
          <ContentContainer {...contentProps} id='overlay-page-content'>
            {children}
          </ContentContainer>
        </View>
      )
    }

    // Default fullscreen variant
    return (
      <View style={[styles.fullscreenContainer]} id='overlay-fullscreen-container'>
        {/* Header with title and close button */}
        {(title || closable) && (
          <View style={styles.fullscreenHeader}>
            <Text variant='title' size='md'>
              {title}
            </Text>
            {closable && (
              <Button
                icon="close"
                variant='secondary'
                onPress={onClose}
                style={{ marginRight: -8 }}
              />
            )}
          </View>
        )}

        {/* Content area */}
        <View style={styles.fullscreenContent} id='overlay-fullscreen-content'>
          {children}
        </View>
      </View>
    )
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top,
          bottom: insets.bottom,
        },
        animatedContainerStyle
      ]}
    >
      <View style={styles.contentArea} pointerEvents="auto">
        {renderContent()}
      </View>
    </Animated.View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    flex: 1,
    position: 'absolute',
    overflow: 'hidden',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: OVERLAY_Z_INDEX,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

  // Fullscreen variant (default)
  fullscreenContainer: {
    flex: 1,
    borderRadius: BORDER_RADIUS,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
    width: '100%',
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: theme.dimensions.HEADER_HEIGHT,
    paddingHorizontal: CONTENT_PADDING,
    backgroundColor: theme.deriveColor(theme.colors.surface, 0.2),
    paddingVertical: CONTENT_PADDING / 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.onSurface + '20',
  },
  fullscreenContent: {
    flex: 1,
    paddingHorizontal: 12,
  },

  // Compact variant - centered modal
  compactContainer: {
    justifyContent: 'center',
    alignContent: 'center',
    marginHorizontal: 20,
    borderRadius: BORDER_RADIUS,
    padding: 8,
    backgroundColor: theme.colors.surface,
  },
  compactHeader: {
    flexDirection: 'row',
    alignContent: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  compactContent: {
    backgroundColor: theme.colors.surface,
  },


  // Page variant - fullscreen with PageHeader
  pageContainer: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  pageContent: {
    flex: 1,
  },
  pageScrollContent: {
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
}))

export { OverlayProvider }
export default OverlayContainer