import { IconButton } from '@app/shared/components/button/Button'
import PageHeader from '@app/shared/components/page/PageHeader'
import Text from '@app/shared/components/text/Text'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import React, { useEffect, useRef } from 'react'
import { Animated, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Option } from '../components/types'
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

// Content styling constants
const BORDER_RADIUS = 12
const CONTENT_PADDING = 16

export type OverlayVariant = 'compact' | 'fullscreen' | 'page'

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
  const { fadeAnim, scaleAnim, shouldRender } = useOverlayAnimation(visible ?? true)
  const insets = useSafeAreaInsets()
  
  if (!shouldRender || !styles) {
    return null
  }

  const overlayTransparency = transparent ? theme.constants.OVERLAY_TRANSPARENCY : 1
  
  // Render content based on variant
  const renderContent = () => {
    // Compact variant - centered modal with rounded corners
    if (variant === 'compact') {
      return (
        <View style={styles.compactContainer}  id='overlay-compact-container'>
          {/* Header with title and close button */}
          {(title || closable) && (
            <View style={styles.compactHeader}>
              {title && <Text style={styles.compactTitle}>{title}</Text>}
              {closable && (
                <IconButton
                  name="close"
                  variant="outlined"
                  onPress={onClose}
                  size={20}
                />
              )}
            </View>
          )}
          {/* Content area */}
          <View style={styles.compactContent} id='overlay-compact-content'>{children}</View>
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
            action={<IconButton onPress={onClose} name='arrow-back' variant='outlined' size={24} />}
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
            {title && (
              <Text style={styles.fullscreenTitle}>
                {title}
              </Text>
            )}
            {closable && (
              <IconButton
                name="close"
                variant="outlined"
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
        <View style={styles.contentArea} pointerEvents="auto">
          {renderContent()}
        </View>
      </Animated.View>
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
    backgroundColor: theme.colors.background
  },
  animatedContainer: {
    height: '100%',
    overflow: 'hidden'
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
    height: theme.constants.HEADER_HEIGHT,
    paddingHorizontal: CONTENT_PADDING,
    backgroundColor: theme.deriveColor(theme.colors.surface, 0.2),
    paddingVertical: CONTENT_PADDING / 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.onSurface + '20',
  },
  fullscreenTitle: {
    ...theme.text.size.sm,
    color: theme.colors.onSurface,
    flex: 1,
  },
  fullscreenContent: {
    flex: 1,
    paddingHorizontal: 12,
  },
  
  // Compact variant - centered modal
  compactContainer: {
    position: 'relative',
    marginTop: 60,
    flex:1,
    backgroundColor: theme.colors.background,
  },
  compactHeader: {
    flexDirection: 'row',
    alignContent: 'flex-end',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 8,
    marginLeft: 'auto',
    borderRadius: 8,
    gap: 8,
  },
  compactTitle: {
    ...theme.text.size.lg,
    color: theme.colors.onSurface,
  },
  compactContent: {
    flex:1,
    gap: 12,
    padding: 8,
    borderRadius: 8,
  },
  
  // Page variant - fullscreen with PageHeader
  pageContainer: {
    flex: 1,
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