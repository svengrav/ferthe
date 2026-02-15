import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { Button, TextInput } from '@app/shared/components'
import { Theme, useTheme } from '@app/shared/theme'

interface ItemTextEditorProps {
  value: string
  onSubmit: (value: string) => Promise<void>
  placeholder?: string
  multiline?: boolean
  maxLength?: number
  validator?: (value: string) => boolean
  disabled?: boolean
}

/**
 * Reusable inline editor component for quick text edits.
 * Displays a TextInput with a submit button for saving changes.
 */
function ItemTextEditor(props: ItemTextEditorProps) {
  const {
    value: initialValue,
    onSubmit,
    placeholder,
    multiline = false,
    maxLength,
    validator,
    disabled = false,
  } = props

  const { styles } = useTheme(createStyles)
  const [value, setValue] = useState(initialValue)
  const [isSaving, setIsSaving] = useState(false)

  // Determine if submit is allowed
  const hasChanged = value !== initialValue
  const isValid = validator ? validator(value.trim()) : true
  const canSubmit = hasChanged && isValid && !isSaving && !disabled

  // Submit the edited value
  const handleSubmit = async () => {
    const trimmedValue = value.trim()

    if (!trimmedValue && validator) {
      return
    }

    if (validator && !validator(trimmedValue)) {
      return
    }

    setIsSaving(true)
    try {
      await onSubmit(trimmedValue)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        multiline={multiline}
        maxLength={maxLength}
        editable={!isSaving && !disabled}
        style={styles.input}
      />
      <Button
        icon="check"
        onPress={handleSubmit}
        disabled={!canSubmit}
        size='md'
        variant="secondary"
      />
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  input: {
    flex: 1,
  },
})

export default ItemTextEditor
