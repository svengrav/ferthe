import { Controller, useFormContext } from 'react-hook-form'

import Picker from '../picker/Picker'
import { ComponentVariant } from '../types'
import FormField from './FormField'

interface FormPickerProps {
  name: string
  options: { label: string; value: string }[]
  label?: string
  helperText?: string
  variant?: ComponentVariant
}

/**
 * Form picker field using FormProvider context.
 * Supports label, error, and helper text display.
 */
function FormPicker({ name, options, label, helperText, variant }: FormPickerProps) {
  const { control } = useFormContext()

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <FormField
          label={label}
          error={error?.message}
          helperText={!error ? helperText : undefined}>
          <Picker
            options={options}
            selected={value}
            onValueChange={onChange}
            variant={variant}
          />
        </FormField>
      )}
    />
  )
}

export default FormPicker
