import { useFormContext } from 'react-hook-form'
import Button from '../button/Button'

interface FormSubmitButtonProps {
  label: string
  variant?: 'primary' | 'secondary' | 'outlined'
}

/**
 * Submit button for forms using FormProvider context.
 * Automatically handles validation state and submission.
 */
function FormSubmitButton({ label, variant = 'primary' }: FormSubmitButtonProps) {
  const {
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useFormContext()

  return (
    <Button
      label={label}
      variant={variant}
      onPress={handleSubmit((data) => console.log(data))}
      disabled={!isValid || isSubmitting}
    />
  )
}

export default FormSubmitButton
