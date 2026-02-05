import { Controller, useFormContext } from 'react-hook-form'

import Field from '../field/Field'
import Picker from '../picker/Picker'
import { ComponentSize, ComponentVariant } from '../types'

interface FormPickerProps {
  name: string
  options: { label: string; value: string }[]
  label?: string
  helperText?: string
  variant?: ComponentVariant
  size?: ComponentSize
}

/**
 * Form picker field using FormProvider context.
 * Supports label, error, and helper text display.
 */
function FormPicker({ name, options, label, helperText, variant, size }: FormPickerProps) {
  const { control } = useFormContext()

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <Field
          label={label}
          error={error?.message}
          helperText={!error ? helperText : undefined}>
          <Picker
            options={options}
            selected={value}
            onValueChange={onChange}
            variant={variant}
            size={size}
          />
        </Field>
      )}
    />
  )
}

export default FormPicker
