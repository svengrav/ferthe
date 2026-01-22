import { Card, Image, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { setOverlay } from '@app/shared/overlay/useOverlayStore'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { Trail } from '@shared/contracts'
import { useRef, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import TrailDetails from './TrailDetails'

// Avatar constants
const AVATAR_SIZE = 50
const AVATAR_BORDER_RADIUS = 4
const AVATAR_LINE_HEIGHT = 50

// Card constants
const TEXT_CONTAINER_PADDING = 8
const DESCRIPTION_WIDTH = '95%'
const DESCRIPTION_MAX_LINES = 2

/**
 * Hook to manage trail card interactions and state
 */
const useTrailCard = (trail: Trail) => {
  const [contextMenu, setContextMenu] = useState(false)
  const cardRef = useRef<View>(null)
  const { t } = useLocalizationStore()

  const handleOpenTrailOverview = () => {
    setOverlay(<TrailDetails trail={trail} />)
  }

  const openContextMenu = () => setContextMenu(true)
  const closeContextMenu = () => setContextMenu(false)

  return {
    contextMenu,
    cardRef,
    t,
    handleOpenTrailOverview,
    openContextMenu,
    closeContextMenu,
  }
}

interface TrailCardProps {
  trail: Trail
}

/**
 * Avatar component for displaying trail initial
 */
export function TrailAvatar({ trail }: { trail: Trail }) {
  const { styles } = useApp(useAvatarStyles)

  if (!styles) return null

  const avatarText = trail.name ? trail.name.charAt(0).toUpperCase() : ''

  if (!trail.image?.url) {
    return (
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarText}</Text>
      </View>
    )
  }

  return (
    <Image
      width={AVATAR_SIZE}
      height={AVATAR_SIZE}
      source={{ uri: trail.image?.url || '' }}
      style={styles.avatar}
    />
  )
}

/**
 * Trail card component displaying trail information with context menu and overlay
 */
function TrailItem({ trail }: TrailCardProps) {
  const { styles } = useApp(useStyles)
  const {
    cardRef,
    t,
    handleOpenTrailOverview,
    openContextMenu,
  } = useTrailCard(trail)

  if (!styles) return null

  const renderCardContent = () => (
    <View style={styles.content}>
      <TrailAvatar trail={trail} />
      <View style={styles.textContainer}>
        <Text variant='title' size='md'>{trail.name}</Text>
        <Text
          variant='body'
          size='sm'
          ellipsizeMode="tail"
          numberOfLines={DESCRIPTION_MAX_LINES}
        >
          {trail?.description || t.trails.noDescription}
        </Text>
      </View>
    </View>
  )

  return (
    <View>
      <TouchableOpacity onPress={handleOpenTrailOverview} onLongPress={openContextMenu}>
        <Card ref={cardRef}>
          {renderCardContent()}
        </Card>
      </TouchableOpacity>
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
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },

}))

export default TrailItem
