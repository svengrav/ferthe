import { View } from 'react-native'

import { Button, TextInput } from '@app/shared/components'
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

  if (!styles) return null

  return (
    <View style={styles.section}>
      <View style={styles.inputRow}>
        <TextInput
          helperText='Join with Invite Code'
          style={styles.input}
          placeholder="Your Code"
          value={code}
          onChangeText={text => setCode(text.toUpperCase())}
          maxLength={maxLength}
        />
        <Button
          label="Join"
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
