import { Theme, themedVariants, useVariants } from '@app/shared/theme'
import useThemeStore from '@app/shared/theme/themeStore'
import { ImageReference } from '@shared/contracts'
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import Icon from '../icon/Icon.tsx'
import { Image } from '../image/Image'
import { ComponentVariant } from '../types'

interface AvatarProps {
  avatarUrl?: string
  avatar?: ImageReference
  label?: string
  onPress?: () => void
  size?: number
  showEditIcon?: boolean
  variant?: ComponentVariant
  style?: StyleProp<ViewStyle>
}

const ringVariants = themedVariants<ViewStyle>({
  base: { borderRadius: 999 },
  variants: {
    variant: {
      primary: (t) => ({}),
      secondary: (t) => ({}),
      outlined: (t) => ({ borderWidth: 2, borderColor: t.colors.divider }),
    },
  },
})

/**
 * Reusable avatar component with optional edit functionality
 * Displays user avatar with label fallback or placeholder icon
 */
function Avatar(props: AvatarProps) {
  const { avatarUrl, avatar, label, onPress, size = 100, showEditIcon = false, variant, style } = props
  const theme = useThemeStore()
  const styles = createStyles(theme, size)
  const ringStyle = variant ? useVariants(ringVariants, { variant }) : undefined

  // Determine source (priority: avatar > avatarUrl)
  const source = avatar || (avatarUrl ? { uri: avatarUrl } : undefined)

  return (
    <View style={[styles.container, ringStyle, style]} id='avatar-container'>
      <Pressable onPress={onPress} disabled={!onPress} >
        {showEditIcon && onPress && (
          <View style={styles.editBadge}>
            <Icon name="edit" size='md' />
          </View>
        )}
        <View style={styles.avatarContainer}>
          <Image
            source={source}
            label={label}
            width={size}
            height={size}
            style={styles.avatar}
            placeholder={
              <View style={styles.placeholder}>
                <Icon name="person" size='md' color="#999" />
              </View>
            }
          />
        </View>
      </Pressable>
    </View>
  )
}

const createStyles = (theme: Theme, size: number) => {
  const avatarSize = { width: size, height: size, borderRadius: size / 2 }

  return StyleSheet.create({
    container: {
      position: 'relative',
      alignItems: 'center',
    },
    avatarContainer: {
      ...avatarSize,
      overflow: 'hidden',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    editBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99,
    },
  })
}

export default Avatar
