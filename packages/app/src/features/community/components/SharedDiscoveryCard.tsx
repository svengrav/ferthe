import { useAccountData } from '@app/features/account/stores/accountStore'
import { Button, Text } from '@app/shared/components'
import { Dialog } from '@app/shared/components/'
import { useLocalization } from '@app/shared/localization'
import { setOverlay, useOverlayStore } from '@app/shared/overlay'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { createThemedStyles, useTheme } from '@app/shared/theme'
import { logger } from '@app/shared/utils/logger'
import { Discovery } from '@shared/contracts'
import { useState } from 'react'
import { Pressable, View } from 'react-native'

const IMAGE_HEIGHT = 120

interface SharedDiscoveryCardProps {
  discovery: Discovery
  communityId: string
  onUnshared?: () => void
}

/**
 * Card component for shared discoveries in a community.
 * Shows discovery info and unshare button for own discoveries.
 */
function SharedDiscoveryCard({ discovery, communityId, onUnshared }: SharedDiscoveryCardProps) {
  const { styles } = useTheme(useStyles)
  const { communityApplication } = getAppContextStore()
  const { account } = useAccountData()
  const { locales } = useLocalization()
  const [isUnsharing, setIsUnsharing] = useState(false)

  if (!styles) return null

  const isOwnDiscovery = discovery.accountId === account?.id

  const handleUnshare = () => {
    setOverlay(
      'confirmUnshare',
      <Dialog
        title={locales.community.unshareDiscovery}
        message={locales.community.removeDiscoveryConfirm}
        confirmText={locales.community.unshare}
        destructive
        onConfirm={async () => {
          useOverlayStore.getState().removeByKey('confirmUnshare')
          setIsUnsharing(true)
          const result = await communityApplication.unshareDiscovery(discovery.id, communityId)
          setIsUnsharing(false)

          if (result.success) {
            onUnshared?.()
          } else {
            logger.error('Unshare discovery failed:', result.error)
          }
        }}
        onCancel={() => useOverlayStore.getState().removeByKey('confirmUnshare')}
      />,

    )
  }

  const handlePress = () => {
    // TODO: Navigate to discovery details
    logger.log('Open discovery details:', discovery.id)
  }

  return (
    <Pressable onPress={handlePress} style={styles.card}>
      <View style={styles.placeholder} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text variant="subtitle" numberOfLines={1}>
              Discovery
            </Text>
            <Text variant="caption" style={styles.date}>
              {new Date(discovery.discoveredAt).toLocaleDateString()}
            </Text>
          </View>

          {isOwnDiscovery && (
            <Button
              icon="close"
              onPress={handleUnshare}
              disabled={isUnsharing}
            />
          )}
        </View>
      </View>
    </Pressable>
  )
}

const useStyles = createThemedStyles(theme => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  placeholder: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  date: {
    color: theme.deriveColor(theme.colors.onSurface, 0.6),
    marginTop: 4,
  },
}))

export default SharedDiscoveryCard
