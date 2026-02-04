import { Controller, useFormContext } from 'react-hook-form';
import Picker from './Picker';

interface FormPickerProps {
  name: string
  options: { label: string; value: string }[]
}

/**
 * Form picker field using FormProvider context.
 */
function FormPicker({ name, options }: FormPickerProps) {
  const { control } = useFormContext()

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <Picker options={options} selected={value} onValueChange={onChange} />
      )}
    />
  )
}

export default FormPicker
