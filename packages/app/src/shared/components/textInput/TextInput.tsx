import Text from '@app/shared/components/text/Text'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { TextInput as RNTextInput, TextInputProps as RNTextInputProps, View } from 'react-native'

interface TextInputProps extends RNTextInputProps {
  label?: string
  helperText?: string
  error?: string | boolean
}

const TextInput = ({ label, helperText, error, style, multiline, ...props }: TextInputProps) => {
  const { styles, theme } = useApp(useStyles)
  const isError = typeof error === 'string' ? true : !!error
  const helper = typeof error === 'string' ? error : helperText

  if (!styles) {
    return null
  }

  return (
    <View style={styles.container}>
      {label && <Text variant="label" style={styles.label}>{label}</Text>}

      <RNTextInput
        style={[styles.input, multiline && styles.multiline, isError && styles.inputError, style]}
        placeholderTextColor={theme.deriveColor(theme.colors.onBackground, 0.4)}
        multiline={multiline}
        {...props}
      />

      {helper && <Text style={[styles.helper, isError && styles.helperError]}>{helper}</Text>}
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  container: {
    flex: 1,
    gap: 6,
  },
  label: {
    color: theme.deriveColor(theme.colors.onBackground, 0.7),
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
    color: theme.colors.onSurface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  helper: {
    fontSize: 12,
    color: theme.deriveColor(theme.colors.onSurface, 0.6),
  },
  helperError: {
    color: theme.colors.error,
  },
}))

export default TextInput
