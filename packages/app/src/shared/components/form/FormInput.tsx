import { Controller, useFormContext } from 'react-hook-form'
import { TextInputProps as RNTextInputProps } from 'react-native'
import TextInput from '../textInput/TextInput'

interface FormInputProps extends Omit<RNTextInputProps, 'value' | 'onChangeText' | 'onBlur'> {
  name: string
  label?: string
  helperText?: string
  coerceNumber?: boolean
}

/**
 * Form input field using FormProvider context.
 * Automatically displays validation errors from Zod schema.
 */
function FormInput({
  name,
  label,
  helperText,
  coerceNumber = false,
  ...textInputProps
}: FormInputProps) {
  const { control } = useFormContext()

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <TextInput
          label={label}
          value={coerceNumber ? String(value ?? '') : value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          helperText={!error ? helperText : undefined}
          {...textInputProps}
        />
      )}
    />
  )
}

export default FormInput
