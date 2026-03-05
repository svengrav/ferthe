import { createThemedStyles, useTheme } from "@app/shared/theme"
import { ImageReference, Trail } from "@shared/contracts"
import { Image, Text } from "@app/shared/components"

const AVATAR_SIZE = 50
const AVATAR_BORDER_RADIUS = 4
const AVATAR_LINE_HEIGHT = 50

interface TrailAvatarProps {
  label?: string,
  source?: ImageReference
  size?: number
}

/**
 * Avatar component for displaying trail initial
 */
export function TrailAvatar(props: TrailAvatarProps) {
  const { label, source, size = AVATAR_SIZE } = props
  const { styles } = useTheme(useAvatarStyles)
  return (
    <Image
      source={source}
      label={label}
      style={[styles.avatar, { width: size, height: size }]}
      placeholder={<Text>{label} </Text>}
    />
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
