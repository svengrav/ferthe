import { useThemeStore } from '@app/shared/theme'
import { Theme } from '@app/shared/theme/types'
import * as Formik from 'formik'
import { forwardRef, useImperativeHandle } from 'react'
import { StyleSheet, View } from 'react-native'
import Button from '../button/Button'
import FormField from './FormField'

interface FormAction {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outlined'
  disabled?: boolean
}

export interface FormRef {
  submit: () => void
  reset: () => void
  validate: () => boolean
  getValues: () => Record<string, any>
  setFieldValue: (field: string, value: any) => void
}

export interface FormFieldConfig {
  name: string
  label?: string
  description?: string
  placeholder?: string
  type?: 'text' | 'textarea' | 'number' | 'email' | 'password'
  variant?: 'default' | 'textarea'
  required?: boolean
  multiline?: boolean
  error?: string
  value?: string
  onChange?: (value: string) => void
  validation?: (value: string) => string | boolean
  onReset?: () => void
}

interface FormProps {
  fields: FormFieldConfig[]
  onSubmit: (values: Record<string, any>) => void
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
  actions?: FormAction[]
  showDefaultActions?: boolean
}


interface FormAction {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outlined'
  disabled?: boolean
}


interface FormProps {
  fields: FormFieldConfig[]
  onSubmit: (values: Record<string, any>) => void
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
  actions?: FormAction[]
  showDefaultActions?: boolean
}

const Form = forwardRef<FormRef, FormProps>(({
  fields,
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  actions,
  showDefaultActions = true
}, ref) => {
  const theme = useThemeStore()
  const styles = createStyles(theme)

  // Generate initial values from fields
  const initialValues = fields.reduce((acc, field) => {
    acc[field.name] = field.value || ''
    return acc
  }, {} as Record<string, any>)

  // Generate validation schema from fields
  const validate = (values: Record<string, any>) => {
    const errors: Record<string, string> = {}

    fields.forEach(field => {
      const value = values[field.name]

      // Check if field is required
      if (field.required && (!value || value.toString().trim() === '')) {
        errors[field.name] = `${field.label || field.name} is required`
        return
      }

      // Run custom validation if provided
      if (field.validation && value) {
        const result = field.validation(value.toString())
        if (typeof result === 'string') {
          errors[field.name] = result
        } else if (result === false) {
          errors[field.name] = `${field.label || field.name} is invalid`
        }
      }
    })

    return errors
  }

  const handleSubmit = (values: Record<string, any>) => {
    onSubmit(values)
  }

  const defaultActions: FormAction[] = [
    ...(onCancel ? [{
      label: cancelLabel,
      onPress: onCancel,
      variant: 'outlined' as const
    }] : []),
    {
      label: submitLabel,
      onPress: () => { }, // Will be handled by Formik
      variant: 'primary' as const
    }
  ]

  const finalActions = actions || (showDefaultActions ? defaultActions : [])

  return (
    <Formik.Formik
      initialValues={initialValues}
      validate={validate}
      onSubmit={handleSubmit}
    >
      {(formikProps) => {
        // Expose methods through ref
        useImperativeHandle(ref, () => ({
          submit: formikProps.submitForm,
          reset: formikProps.resetForm,
          validate: () => {
            formikProps.validateForm()
            return Object.keys(formikProps.errors).length === 0
          },
          getValues: () => formikProps.values,
          setFieldValue: formikProps.setFieldValue,
        }))

        return (
          <View style={styles.container}>
            <View style={styles.content}>
              {fields.map((field) => (
                <FormField
                  description={field.description}
                  key={field.name}
                  label={field.label}
                  placeholder={field.placeholder}
                  value={formikProps.values[field.name]}
                  onChangeText={(text) => {
                    // Handle number input filtering
                    let value = text
                    if (field.type === 'number') {
                      value = text.replace(/[^0-9.-]/g, '')
                    }

                    formikProps.setFieldValue(field.name, value)
                    field.onChange?.(value)
                  }}
                  onBlur={() => formikProps.setFieldTouched(field.name, true)} error={
                    formikProps.touched[field.name] && formikProps.errors[field.name]
                      ? String(formikProps.errors[field.name])
                      : undefined
                  }
                  required={field.required}
                  variant={field.variant || (field.type === 'textarea' || field.multiline ? 'textarea' : 'default')}
                  multiline={field.type === 'textarea' || field.multiline}
                  secureTextEntry={field.type === 'password'}
                  keyboardType={
                    field.type === 'email' ? 'email-address' :
                      field.type === 'number' ? 'numeric' : 'default'
                  }
                />
              ))}
            </View>

            {finalActions.length > 0 && (
              <View style={styles.actions}>
                {finalActions.map((action, index) => (
                  <Button
                    key={index}
                    label={action.label}
                    onPress={action.label === submitLabel ? formikProps.submitForm : action.onPress}
                    variant={action.variant}
                    disabled={action.disabled}
                  />
                ))}
              </View>
            )}
          </View>
        )
      }}
    </Formik.Formik>
  )
})

export default Form

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
    },
  })
