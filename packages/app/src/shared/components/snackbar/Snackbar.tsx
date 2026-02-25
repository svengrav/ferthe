import Icon, { IconName } from '@app/shared/components/icon/Icon'
import Text from '@app/shared/components/text/Text'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { useEffect } from 'react'
import { Pressable, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { create } from 'zustand'

const DEFAULT_DURATION = 3000
const ANIMATION_DURATION = 250
const MAX_WIDTH = 600
const SNACKBAR_Z_INDEX = 2000

type SnackbarVariant = 'success' | 'error' | 'info' | 'warning'

interface SnackbarAction {
  label: string
  onPress: () => void
}

interface SnackbarConfig {
  message: string
  variant?: SnackbarVariant
  duration?: number
  action?: SnackbarAction
  showClose?: boolean
}

interface SnackbarState {
  visible: boolean
  config: SnackbarConfig | null
  show: (config: SnackbarConfig) => void
  hide: () => void
}

export const useSnackbarStore = create<SnackbarState>(set => ({
  visible: false,
  config: null,
  show: config => set({ visible: true, config }),
  hide: () => set({ visible: false, config: null }),
}))

export function showSnackbar(config: SnackbarConfig | string) {
  const { show, hide } = useSnackbarStore.getState()
  const snackbarConfig: SnackbarConfig = typeof config === 'string' ? { message: config } : config

  show(snackbarConfig)

  const duration = snackbarConfig.duration ?? DEFAULT_DURATION
  if (duration > 0) {
    setTimeout(hide, duration)
  }
}

const VARIANT_CONFIG: Record<SnackbarVariant, { icon: IconName; color: string }> = {
  success: { icon: 'check-circle' as IconName, color: '#4caf50' },
  error: { icon: 'error' as IconName, color: '#dd4c4c' },
  info: { icon: 'info' as IconName, color: '#7c21f3' },
  warning: { icon: 'warning' as IconName, color: '#ff9800' },
}

/**
 * Global snackbar component for temporary feedback messages.
 * Bottom-aligned, non-blocking UI element with optional actions.
 */
function Snackbar() {
  const { styles, theme } = useTheme(useStyles)
  const { visible, hide, config } = useSnackbarStore()
  const insets = useSafeAreaInsets()

  const translateY = useSharedValue(100)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: ANIMATION_DURATION })
      opacity.value = withTiming(1, { duration: ANIMATION_DURATION })
    } else {
      translateY.value = withTiming(100, { duration: ANIMATION_DURATION })
      opacity.value = withTiming(0, { duration: ANIMATION_DURATION })
    }
  }, [visible])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  if (!config || !visible) return null

  const variant = config.variant ?? 'info'
  const variantConfig = VARIANT_CONFIG[variant]

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: insets.bottom + 16 },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.messageContainer}>
          <Icon
            name={variantConfig.icon}
            size='md'
            color={variantConfig.color}
          />
          <Text variant='body' style={styles.message} numberOfLines={2}>
            {config.message}
          </Text>
        </View>

        <View style={styles.actions}>
          {config.action && (
            <Pressable
              onPress={() => {
                config.action?.onPress()
                hide()
              }}
              style={styles.actionButton}
            >
              <Text variant='body' style={[styles.actionText, { color: theme.colors.primary }]}>
                {config.action.label}
              </Text>
            </Pressable>
          )}

          {config.showClose && (
            <Pressable onPress={hide} style={styles.closeButton}>
              <Icon name={'close' as IconName} size='sm' color={theme.colors.onSurface} />
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    zIndex: SNACKBAR_Z_INDEX,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.black,
    borderRadius: theme.tokens.borderRadius.md,
    padding: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  messageContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  message: {
    flex: 1,
    color: theme.colors.onSurface,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
}))

export default Snackbar
