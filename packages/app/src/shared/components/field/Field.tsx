import { ReactNode } from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'

import Text from '@app/shared/components/text/Text'
import { Theme, useTheme } from '@app/shared/theme'

interface FieldProps {
  /** Label displayed above the input */
  label?: string
  /** Helper text displayed below the input */
  helperText?: string
  /** Error message or boolean flag */
  error?: string | boolean
  /** Input component to render */
  children: ReactNode
  /** Custom styles */
  style?: ViewStyle
}

/**
 * Wrapper component for form inputs.
 * Handles label, error, and helper text display consistently.
 */
function Field(props: FieldProps) {
  const { label, helperText, error, children, style } = props
  const { styles, theme } = useTheme(createStyles)

  const isError = typeof error === 'string' ? true : !!error
  const helper = typeof error === 'string' ? error : helperText

  return (
    <View style={[styles.container, style]} id="field-container">
      {label && <Text variant="label" style={styles.label}>{label}</Text>}
      {children}
      {helper && <Text style={[styles.helper, isError && styles.helperError]}>{helper}</Text>}
    </View>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      zIndex: 1,
      position: 'relative',
      gap: 6,
    },
    label: {
      color: theme.deriveColor(theme.colors.onBackground, 0.7),
    },
    helper: {
      fontSize: 12,
      color: theme.deriveColor(theme.colors.onSurface, 0.6),
    },
    helperError: {
      paddingHorizontal: 4,
      color: theme.colors.error,
    },
  })

export default Field
