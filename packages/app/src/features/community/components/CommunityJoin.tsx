import { useState } from 'react'
import { StyleSheet } from 'react-native'

import { Button, Stack, Text, TextInput } from '@app/shared/components'
import Field from '@app/shared/components/field/Field'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { Theme, useTheme } from '@app/shared/theme'

interface CommunityJoinProps {
  onJoin: (code: string) => void
  disabled: boolean
  maxLength: number
}

export function CommunityJoin(props: CommunityJoinProps) {
  const { onJoin, disabled, maxLength } = props
  const { styles } = useTheme(createStyles)
  const { t } = useLocalizationStore()
  const [code, setCode] = useState('')

  const handleJoin = () => {
    onJoin(code)
  }

  return (
    <Stack spacing="lg">
      <Text variant="heading">{t.community.joinCommunity}</Text>
      <Stack spacing="sm">
        <Field
          style={{ flex: 1 }}
          helperText={t.community.joinWithInviteCode}
        >
          <TextInput
            style={styles.input}
            placeholder={t.community.yourCode}
            value={code}
            onChangeText={text => setCode(text.toUpperCase())}
            maxLength={maxLength}
          />
        </Field>
        <Button
          label={t.community.join}
          onPress={handleJoin}
          disabled={disabled || code.length !== maxLength}
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
