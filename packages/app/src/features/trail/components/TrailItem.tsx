import { Card, Divider, Image, Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { Trail } from '@shared/contracts'
import { useRef, useState } from 'react'
import { Pressable, StyleProp, View, ViewStyle } from 'react-native'
import { TrailAvatar } from './TrailAvatar'

// Avatar constants
const DESCRIPTION_MAX_LINES = 1

/**
 * Hook to manage trail card interactions and state
 */
const useTrailItem = (trail: Trail) => {
  const [contextMenu, setContextMenu] = useState(false)
  const cardRef = useRef<View>(null)
  const { locales } = useLocalization()

  const openContextMenu = () => setContextMenu(true)
  const closeContextMenu = () => setContextMenu(false)

  return {
    contextMenu,
    cardRef,
    locales,
    openContextMenu,
    closeContextMenu,
  }
}

interface TrailCardProps {
  onAvatarPress?: (trail: Trail) => void
  onPress?: (trail: Trail) => void
  trailing?: React.ReactNode
  trail: Trail
  style?: StyleProp<ViewStyle>
}

/**
 * Trail card component displaying trail information with context menu and overlay
 */
function TrailItem(props: TrailCardProps) {
  const { trail, trailing, onPress, onAvatarPress, style } = props
  const { styles } = useTheme(useStyles)
  const {
    cardRef,
    locales,
    openContextMenu,
  } = useTrailItem(trail)
  const itemTap = onPress

  return (
    <Pressable onPress={() => itemTap?.(trail)} onLongPress={openContextMenu} id="trail-item-container" style={[styles.container, style]} ref={cardRef}>
      <View style={styles.content} id="trail-card-content">
        <TrailAvatar source={trail.image} label={trail.name} onPress={() => onAvatarPress?.(trail)} />
        <View style={styles.textContainer}>
          <Text variant='label'>{trail.name} </Text>
          <Text
            variant='subtitle'
            size='sm'
            ellipsizeMode="tail"
            numberOfLines={DESCRIPTION_MAX_LINES}
          >
            {trail?.description || locales.trails.noDescription}
          </Text>
        </View>
        <View>
          {trailing}
        </View>
      </View>
    </Pressable>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    padding: theme.tokens.spacing.md,
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
