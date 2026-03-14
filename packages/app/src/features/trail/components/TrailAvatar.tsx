import { createThemedStyles, useTheme } from "@app/shared/theme"
import { ImageReference, Trail } from "@shared/contracts"
import { Image, Text } from "@app/shared/components"
import { Pressable, StyleProp, ViewStyle } from "react-native"
import { ImageStyle } from "expo-image"

const AVATAR_SIZE = 50
const AVATAR_BORDER_RADIUS = 4
const AVATAR_LINE_HEIGHT = 50

interface TrailAvatarProps {
  onPress?: () => void
  label?: string,
  source?: ImageReference
  size?: number
  style?: StyleProp<ImageStyle>
}

/**
 * Avatar component for displaying trail initial
 */
export function TrailAvatar(props: TrailAvatarProps) {
  const { label, source, size = AVATAR_SIZE, style, onPress } = props
  const { styles } = useTheme(useAvatarStyles)
  return (
    <Pressable onPress={onPress}>
      <Image
        source={source}
        label={label}
        style={[styles.avatar, { width: size, height: size }, style]}
        placeholder={<Text style={styles.avatarText}>{label?.[0] ?? '?'} </Text>}
      />
    </Pressable>
  )
}

const useAvatarStyles = createThemedStyles(theme => ({
  avatar: {
    aspectRatio: 1 / 1,
    borderRadius: AVATAR_BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  avatarText: {
    textAlign: 'center',
    lineHeight: AVATAR_LINE_HEIGHT,
    color: theme.colors.onPrimary,
  },
}))
