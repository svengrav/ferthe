import { getAppContext } from '@app/appContext'
import { useCommunityData } from '@app/features/community/stores/communityStore'
import { Button, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { setOverlay, useOverlayStore } from '@app/shared/overlay'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { logger } from '@app/shared/utils/logger'
import { useState } from 'react'
import { View } from 'react-native'

interface DiscoveryShareSectionProps {
  discoveryId: string
}

/**
 * Share section component that allows sharing discoveries with communities.
 * Handles community selection and share/error states.
 */
function DiscoveryShareSection({ discoveryId }: DiscoveryShareSectionProps) {
  const { styles } = useApp(useStyles)
  const { t } = useLocalizationStore()
  const { communityApplication } = getAppContext()
  const { communities } = useCommunityData()
  const [isSharing, setIsSharing] = useState(false)

  if (!styles || communities.length === 0) return null

  const handleShare = () => {
    const handleShareWithCommunity = async (communityId: string) => {
      useOverlayStore.getState().removeByKey('selectCommunity')
      setIsSharing(true)
      const result = await communityApplication.shareDiscovery(discoveryId, communityId)
      setIsSharing(false)

      if (!result.success) {
        const errorMessage = getErrorMessage(result.error?.code)
        logger.error('Share discovery failed:', result.error?.message || errorMessage)
      }
    }

    setOverlay(
      'selectCommunity',
      <View style={{ gap: 12 }}>
        <Text variant="label">Select a community to share with:</Text>
        <View style={{ gap: 8 }}>
          {communities.map(community => (
            <Button
              key={community.id}
              label={community.name}
              onPress={() => handleShareWithCommunity(community.id)}
              variant="outlined"
            />
          ))}
          <Button
            label={t.discovery.cancel}
            onPress={() => useOverlayStore.getState().removeByKey('selectCommunity')}
            variant="secondary"
          />
        </View>
      </View>,
      { variant: 'compact', title: 'Share Discovery' }
    )
  }

  return (
    <View style={styles.shareContainer}>
      <Button
        label={t.discovery.share}
        align='right'
        onPress={handleShare}
        disabled={isSharing}
      />
    </View>
  )
}

const getErrorMessage = (code?: string): string => {
  switch (code) {
    case 'DISCOVERY_TOO_OLD':
      return 'Discovery is older than 24h and cannot be shared'
    case 'DISCOVERY_SPOT_NOT_IN_COMMUNITY_TRAILS':
      return 'This spot is not part of the community trail'
    default:
      return 'Failed to share discovery'
  }
}

const useStyles = createThemedStyles(theme => ({
  shareContainer: {
    marginVertical: 16,
  },
}))

export default DiscoveryShareSection
