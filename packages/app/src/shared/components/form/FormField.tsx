import { useThemeStore } from '@app/shared/theme'
import { Theme } from '@app/shared/theme/types'
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native'
import Text from '../text/Text'

interface FormFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string
  error?: string
  required?: boolean
  variant?: 'default' | 'textarea'
  description?: string
}

const FormField = ({
  label,
  error,
  required = false,
  variant = 'default',
  description,
  ...textInputProps
}: FormFieldProps) => {
  const theme = useThemeStore()
  const styles = createStyles(theme)

  return (
    <View style={styles.container}>
      {label && (
        <Text variant='label'>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        {...textInputProps}
        style={[
          styles.input,
          variant === 'textarea' && styles.textarea,
          error && styles.inputError,
        ]}
        placeholderTextColor={theme.colors.onSurface + '60'}
        multiline={variant === 'textarea'}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {description && <Text variant="hint">{description}</Text>}
    </View>
  )
}

export default FormField

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    required: {
      color: theme.colors.error,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.divider,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      color: theme.colors.onSurface,
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    textarea: {
      height: 100,
      textAlignVertical: 'top',
    },
    errorText: {
      color: theme.colors.error,
      marginTop: 4,
    },
  })
