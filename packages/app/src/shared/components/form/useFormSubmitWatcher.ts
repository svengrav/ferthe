import { useEffect } from 'react'
import { FieldValues, useFormContext } from 'react-hook-form'

/**
 * Auto-submits form on any field change.
 * Useful for settings forms with instant save behavior.
 */
export const useFormSubmitWatcher = <T extends FieldValues>(
  onSubmit: (values: T) => void
) => {
  const { watch } = useFormContext<T>()

  useEffect(() => {
    const subscription = watch((values) => {
      onSubmit(values as T)
    })
    return () => subscription.unsubscribe()
  }, [watch, onSubmit])
}
