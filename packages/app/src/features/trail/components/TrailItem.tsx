import { Card, Image, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { Trail } from '@shared/contracts'
import { useRef, useState } from 'react'
import { Pressable, View } from 'react-native'

// Avatar constants
const AVATAR_SIZE = 50
const AVATAR_BORDER_RADIUS = 4
const AVATAR_LINE_HEIGHT = 50
const DESCRIPTION_MAX_LINES = 1

/**
 * Hook to manage trail card interactions and state
 */
const useTrailItem = (trail: Trail) => {
  const [contextMenu, setContextMenu] = useState(false)
  const cardRef = useRef<View>(null)
  const { t } = useLocalizationStore()

  const openContextMenu = () => setContextMenu(true)
  const closeContextMenu = () => setContextMenu(false)

  return {
    contextMenu,
    cardRef,
    t,
    openContextMenu,
    closeContextMenu,
  }
}

/**
 * Avatar component for displaying trail initial
 */
export function TrailAvatar({ trail }: { trail: Trail }) {
  const { styles } = useApp(useAvatarStyles)

  if (!styles) return null

  return (
    <Image
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      source={trail.image}
      label={trail.name}
      style={styles.avatar}
    />
  )
}

interface TrailCardProps {
  onPress?: (trail: Trail) => void
  actions?: React.ReactNode
  trail: Trail
}

/**
 * Trail card component displaying trail information with context menu and overlay
 */
function TrailItem({ trail, actions, onPress }: TrailCardProps) {
  const { styles } = useApp(useStyles)
  const {
    cardRef,
    t,
    openContextMenu,
  } = useTrailItem(trail)
  const itemTap = onPress

  if (!styles) return null

  const renderCardContent = () => (
    <View style={styles.content} id="trail-card-content">
      <TrailAvatar trail={trail} />
      <View style={styles.textContainer}>
        <Text variant='title' >{trail.name} </Text>
        <Text
          variant='body'
          size='sm'
          ellipsizeMode="tail"
          numberOfLines={DESCRIPTION_MAX_LINES}
        >
          {trail?.description || t.trails.noDescription}
        </Text>
      </View>
      <View>
        {actions}
      </View>
    </View>
  )

  return (
    <View id="trail-item-container" style={styles.container}>
      <Pressable onPress={() => itemTap?.(trail)} onLongPress={openContextMenu}>
        <Card ref={cardRef}>
          {renderCardContent()}
        </Card>
      </Pressable>
    </View>
  )
}

const useAvatarStyles = createThemedStyles(theme => ({
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  avatarText: {
    textAlign: 'center',
    lineHeight: AVATAR_LINE_HEIGHT,
    color: theme.colors.onPrimary,
  },
}))

const useStyles = createThemedStyles(theme => ({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  textContainer: {
    flex: 1,
  },
}))

export default TrailItem
