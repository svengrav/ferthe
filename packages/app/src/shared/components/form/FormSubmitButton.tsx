import { useFormContext } from 'react-hook-form'
import Button from '../button/Button'
import { useFormSubmit } from './Form'

interface FormSubmitButtonProps {
  label: string
  variant?: 'primary' | 'secondary' | 'outlined'
}

/**
 * Submit button for forms using FormProvider context.
 * Triggers form submission with validation.
 */
function FormSubmitButton({ label, variant = 'primary' }: FormSubmitButtonProps) {
  const { handleSubmit, formState: { isSubmitting } } = useFormContext()
  const { onSubmit, onInvalid } = useFormSubmit()

  const handlePress = () => {
    handleSubmit(onSubmit, onInvalid)()
  }

  return (
    <Button
      label={label}
      variant={variant}
      onPress={handlePress}
      disabled={isSubmitting}
    />
  )
}

export default FormSubmitButton
