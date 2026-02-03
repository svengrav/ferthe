import { getAppContext } from '@app/appContext'
import { useCommunityData } from '@app/features/community/stores/communityStore'
import { Button } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { logger } from '@app/shared/utils/logger'
import { useState } from 'react'
import { Alert, View } from 'react-native'

interface DiscoveryShareSectionProps {
  discoveryId: string
}

/**
 * Share section component that allows sharing discoveries with communities.
 * Handles community selection and share/error states.
 */
function DiscoveryShareSection({ discoveryId }: DiscoveryShareSectionProps) {
  const { styles } = useApp(useStyles)
  const { communityApplication } = getAppContext()
  const { communities } = useCommunityData()
  const [isSharing, setIsSharing] = useState(false)

  if (!styles || communities.length === 0) return null

  const handleShare = async () => {
    Alert.alert(
      'Share Discovery',
      'Select a community to share with:',
      [
        ...communities.map((community) => ({
          text: community.name,
          onPress: async () => {
            setIsSharing(true)
            const result = await communityApplication.shareDiscovery(discoveryId, community.id)
            setIsSharing(false)

            if (result.success) {
              Alert.alert('Success', 'Discovery shared with community')
            } else {
              const errorMessage = getErrorMessage(result.error?.code)
              Alert.alert('Error', result.error?.message || errorMessage)
              logger.error('Share discovery failed:', result.error)
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    )
  }

  return (
    <View style={styles.shareContainer}>
      <Button
        label="Share with Community"
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
    paddingHorizontal: 16,
  },
}))

export default DiscoveryShareSection
