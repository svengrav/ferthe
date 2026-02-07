import { getAppContext } from '@app/appContext'
import { Button, Stack, TextInput } from '@app/shared/components'
import Field from '@app/shared/components/field/Field'
import { OverlayCard, closeOverlay, setOverlay } from '@app/shared/overlay'
import { useApp } from '@app/shared/useApp'
import { useState } from 'react'

const CODE_LENGTH = 6

/**
 * Hook to open/close the community join card.
 */
export const useCommunityJoinCard = () => ({
  showCommunityJoinCard: () => setOverlay('community-join-card', <CommunityJoinCard onClose={() => closeOverlay('community-join-card')} />),
  closeCommunityJoinCard: () => closeOverlay('community-join-card')
})

/**
 * Hook for managing community join operations.
 * Handles code input state, loading state, and join logic.
 */
const useCommunityJoin = (onClose?: () => void) => {
  const { communityApplication } = getAppContext()
  const [code, setCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  const handleCodeChange = (text: string) => {
    setCode(text.toUpperCase())
  }

  const handleJoin = async () => {
    if (!code.trim() || code.length !== CODE_LENGTH) return

    setIsJoining(true)
    const result = await communityApplication.joinCommunity(code.trim())
    setIsJoining(false)

    if (result.success) {
      onClose?.()
      setCode('')
    }
  }

  return {
    code,
    handleCodeChange,
    handleJoin,
    isJoining,
    isValid: code.length === CODE_LENGTH,
  }
}

interface CommunityJoinCardProps {
  onClose?: () => void
}

/**
 * Component for joining a community with invite code.
 * Wrapped in OverlayCard for modal presentation.
 */
function CommunityJoinCard(props: CommunityJoinCardProps) {
  const { onClose } = props
  const { locales } = useApp()
  const { code, handleCodeChange, handleJoin, isJoining, isValid } = useCommunityJoin(onClose)

  return (
    <OverlayCard title={locales.community.joinCommunity} onClose={onClose}>
      <Stack spacing="lg">
        <Field
          style={{ flex: 1 }}
          helperText={locales.community.joinWithInviteCode}
        >
          <TextInput
            placeholder={locales.community.yourCode}
            value={code}
            onChangeText={handleCodeChange}
            maxLength={CODE_LENGTH}
          />
        </Field>
        <Button
          label={locales.community.join}
          onPress={handleJoin}
          disabled={isJoining || !isValid}
        />
      </Stack>
    </OverlayCard>
  )
}

export default CommunityJoinCard
