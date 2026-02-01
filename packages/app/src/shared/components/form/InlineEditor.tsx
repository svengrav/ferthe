import { Card, IconButton, TextInput } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import React, { useState } from 'react'
import { View } from 'react-native'

interface InlineEditorProps {
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
 * Displays a TextInput with a submit IconButton in a Card layout.
 */
export const InlineEditor: React.FC<InlineEditorProps> = ({
  value: initialValue,
  onSubmit,
  placeholder,
  multiline = false,
  maxLength,
  validator,
  disabled = false,
}) => {
  const { styles } = useApp(useStyles)
  const [value, setValue] = useState(initialValue)
  const [isSaving, setIsSaving] = useState(false)

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

  const hasChanged = value !== initialValue
  const isValid = validator ? validator(value.trim()) : true
  const canSubmit = hasChanged && isValid && !isSaving && !disabled

  if (!styles) return null

  return (
    <Card style={styles.card}>
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
        <IconButton
          name="check"
          onPress={handleSubmit}
          disabled={!canSubmit}
          variant="outlined"
        />
      </View>
    </Card>
  )
}

const useStyles = createThemedStyles(() => ({
  card: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  input: {
    flex: 1,
  },
}))
