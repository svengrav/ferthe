import { getAppContext } from '@app/appContext'
import { Button, Stack, TextInput } from '@app/shared/components'
import Field from '@app/shared/components/field/Field'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { useOverlayStore } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'
import { useState } from 'react'
import { StyleSheet } from 'react-native'

/**
 * Hook for managing community join operations.
 * Handles code input state, loading state, and join logic.
 */
function useCommunityJoin(maxLength: number) {
  const { communityApplication } = getAppContext()
  const [code, setCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  const handleCodeChange = (text: string) => {
    setCode(text.toUpperCase())
  }

  const handleJoin = async () => {
    if (!code.trim() || code.length !== maxLength) return

    setIsJoining(true)
    const result = await communityApplication.joinCommunity(code.trim())
    setIsJoining(false)

    if (result.success) {
      useOverlayStore.getState().removeByKey('joinCommunity')
      setCode('')
    }
  }

  return {
    code,
    handleCodeChange,
    handleJoin,
    isJoining,
    isValid: code.length === maxLength,
  }
}

/**
 * Component for joining a community with invite code.
 * Manages its own state and business logic via useCommunityJoin hook.
 */
export function CommunityJoin() {
  const maxLength = 6
  const { styles } = useTheme(createStyles)
  const { t } = useLocalizationStore()
  const { code, handleCodeChange, handleJoin, isJoining, isValid } = useCommunityJoin(maxLength)

  return (
    <Stack spacing="lg">
      {/* <Text variant="heading">{t.community.joinCommunity}</Text> */}
      <Stack spacing="sm">
        <Field
          style={{ flex: 1 }}
          helperText={t.community.joinWithInviteCode}
        >
          <TextInput
            style={styles.input}
            placeholder={t.community.yourCode}
            value={code}
            onChangeText={handleCodeChange}
            maxLength={maxLength}
          />
        </Field>
        <Button
          label={t.community.join}
          onPress={handleJoin}
          disabled={isJoining || !isValid}
        />
      </Stack>
    </Stack>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
    color: theme.colors.onSurface,
  },
})
