import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { Button, Text, TextInput } from '@app/shared/components'
import Field from '@app/shared/components/field/Field'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { Theme, useTheme } from '@app/shared/theme'

interface JoinCommunitySectionProps {
  onJoin: (code: string) => void
  disabled: boolean
  maxLength: number
}

export function JoinCommunitySection(props: JoinCommunitySectionProps) {
  const { onJoin, disabled, maxLength } = props
  const { styles } = useTheme(createStyles)
  const { t } = useLocalizationStore()
  const [code, setCode] = useState('')

  const handleJoin = () => {
    onJoin(code)
  }

  return (
    <View style={styles.section}>
      <Text variant="heading">Join Community</Text>
      <View style={styles.inputRow}>
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
      </View>
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  section: {
    gap: theme.tokens.spacing.lg,
    marginBottom: 24,
  },
  inputRow: {
    gap: 8,
  },
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
