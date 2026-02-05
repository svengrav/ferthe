import { View } from 'react-native'

import { Button, TextInput } from '@app/shared/components'
import Field from '@app/shared/components/field/Field'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'

interface JoinCommunitySectionProps {
  code: string
  setCode: (code: string) => void
  onJoin: () => void
  disabled: boolean
  maxLength: number
}

export function JoinCommunitySection({
  code,
  setCode,
  onJoin,
  disabled,
  maxLength,
}: JoinCommunitySectionProps) {
  const { styles } = useApp(useStyles)
  const { t } = useLocalizationStore()

  if (!styles) return null

  return (
    <View style={styles.section}>
      <View style={styles.inputRow}>
        <Field
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
          onPress={onJoin}
          disabled={disabled || code.length !== maxLength}
        />
      </View>
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  section: {
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
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
}))
