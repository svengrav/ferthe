import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { TextInput as RNTextInput, TextInputProps as RNTextInputProps } from 'react-native'

interface TextInputProps extends RNTextInputProps {
  error?: boolean
}

const TextInput = ({ error, style, multiline, ...props }: TextInputProps) => {
  const { styles, theme } = useApp(useStyles)

  if (!styles) {
    return null
  }

  return (
    <RNTextInput
      style={[styles.input, multiline && styles.multiline, error && styles.inputError, style]}
      placeholderTextColor={theme.deriveColor(theme.colors.onBackground, 0.4)}
      multiline={multiline}
      {...props}
    />
  )
}

const useStyles = createThemedStyles(theme => ({
  input: {
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
    color: theme.colors.onSurface,
    padding: theme.tokens.spacing.lg,
    borderRadius: theme.tokens.borderRadius.md,
    fontSize: theme.tokens.fontSize.md,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
}))

export default TextInput
