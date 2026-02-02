import { Theme } from '@app/shared/theme'
import useThemeStore from '@app/shared/theme/themeStore'
import { Image, Pressable, StyleSheet, View } from 'react-native'
import Icon from './icon/Icon'

interface AvatarProps {
  avatarUrl?: string
  onPress?: () => void
  size?: number
  showEditIcon?: boolean
}

/**
 * Reusable avatar component with optional edit functionality
 * Displays user avatar or placeholder icon
 */
function Avatar(props: AvatarProps) {
  const { avatarUrl, onPress, size = 100, showEditIcon = false } = props
  const theme = useThemeStore()
  const styles = createStyles(theme, size)

  return (
    <View style={styles.container}>
      <Pressable onPress={onPress} disabled={!onPress} style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholder}>
            <Icon name="person" size={size * 0.5} color="#999" />
          </View>
        )}
      </Pressable>

      {showEditIcon && onPress && (
        <View style={styles.editBadge}>
          <Icon name="edit" size={16} color="#fff" />
        </View>
      )}
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
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.surface,
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
      borderWidth: 2,
      borderColor: theme.colors.background,
    },
  })
}

export default Avatar
