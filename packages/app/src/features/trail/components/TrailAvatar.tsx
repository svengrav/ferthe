import { createThemedStyles, useTheme } from "@app/shared/theme"
import { Trail } from "@shared/contracts"
import { Image, Text } from "@app/shared/components"

const AVATAR_SIZE = 50
const AVATAR_BORDER_RADIUS = 4
const AVATAR_LINE_HEIGHT = 50

/**
 * Avatar component for displaying trail initial
 */
export function TrailAvatar({ trail }: { trail: Trail }) {
  const { styles } = useTheme(useAvatarStyles)
  return (

    <Image

      source={trail.image}
      label={trail.name}
      style={styles.avatar}
      placeholder={<Text>Trail Image</Text>}

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
