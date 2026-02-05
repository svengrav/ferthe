import { zodResolver } from '@hookform/resolvers/zod'
import React, { createContext, useContext } from 'react'
import { DefaultValues, FieldValues, FormProvider, useForm } from 'react-hook-form'
import { View } from 'react-native'
import { ZodObject } from 'zod'

interface FormProps<T extends FieldValues> {
  schema?: ZodObject
  defaultValues?: DefaultValues<T>
  onSubmit: (data: T) => void
  onInvalid?: (errors: any) => void
  children: React.ReactNode
}

interface FormSubmitContextValue {
  onSubmit: (data: any) => void
  onInvalid?: (errors: any) => void
}

const FormSubmitContext = createContext<FormSubmitContextValue | null>(null)

export const useFormSubmit = () => {
  const context = useContext(FormSubmitContext)
  if (!context) throw new Error('useFormSubmit must be used within Form')
  return context
}

/**
 * Generic form wrapper that handles validation and submission.
 * Uses FormProvider to eliminate props drilling for form fields.
 */
function Form<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  onInvalid,
  children,
}: FormProps<T>) {
  const methods = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  return (
    <FormProvider {...methods}>
      <FormSubmitContext.Provider value={{ onSubmit, onInvalid }}>
        <View>{children}</View>
      </FormSubmitContext.Provider>
    </FormProvider>
  )
}

export default Form
