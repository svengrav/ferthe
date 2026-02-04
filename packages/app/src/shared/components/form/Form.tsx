import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import { DefaultValues, FieldValues, FormProvider, useForm } from 'react-hook-form'
import { View } from 'react-native'
import { ZodSchema } from 'zod'

interface FormProps<T extends FieldValues> {
  schema: ZodSchema<T>
  defaultValues: DefaultValues<T>
  onSubmit: (data: T) => void
  children: React.ReactNode
}

/**
 * Generic form wrapper that handles validation and submission.
 * Uses FormProvider to eliminate props drilling for form fields.
 */
function Form<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
}: FormProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange',
  })

  return (
    <FormProvider {...methods}>
      <View>{children}</View>
    </FormProvider>
  )
}

export default Form
