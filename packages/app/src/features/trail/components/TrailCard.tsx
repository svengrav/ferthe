import { Card, DropdownMenu, Image, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { OverlayContainer } from '@app/shared/overlay'
import { setOverlay } from '@app/shared/overlay/useOverlayStore'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { Trail } from '@shared/contracts'
import { useRef, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import TrailDetails from './TrailDetails'

// Avatar constants
const AVATAR_SIZE = 50
const AVATAR_BORDER_RADIUS = 8
const AVATAR_MARGIN_RIGHT = 16
const AVATAR_LINE_HEIGHT = 50

// Card constants
const TEXT_CONTAINER_PADDING = 8
const TEXT_CONTAINER_GAP = 4
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
    let removeOverlay: (() => void) | undefined

    removeOverlay = setOverlay(
      <OverlayContainer title={trail.name} onClose={() => removeOverlay?.()}>
        <TrailDetails trail={trail} />
      </OverlayContainer>
    )
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
function TrailCard({ trail }: TrailCardProps) {
  const { styles } = useApp(useStyles)
  const {
    contextMenu,
    cardRef,
    t,
    handleOpenTrailOverview,
    openContextMenu,
    closeContextMenu,
  } = useTrailCard(trail)

  if (!styles) return null

  const renderCardContent = () => (
    <View style={styles.content}>
      <TrailAvatar trail={trail} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{trail.name}</Text>
        <Text
          style={styles.description}
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
      <DropdownMenu
        isVisible={contextMenu}
        anchorRef={cardRef}
        onClose={closeContextMenu}
        options={[]}
      />
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
  },
  textContainer: {
    flex: 1,
    paddingLeft: 16,
    flexDirection: 'column',
    paddingHorizontal: TEXT_CONTAINER_PADDING,
    overflow: 'hidden',
  },
  title: {
    ...theme.text.size.md,
    fontFamily: theme.text.primary.semiBold,
    color: theme.colors.onSurface,
  },
  description: {
    ...theme.text.size.xs,
    color: theme.colors.onSurface,
    width: DESCRIPTION_WIDTH,
    overflow: 'hidden',
  },
}))

export default TrailCard
