import { MutableRefObject, useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { useTrails } from '@app/features/trail/stores/trailStore'
import { ChipMultiSelect, Form, FormPicker, Stack, Text } from '@app/shared/components'
import { Trail } from '@shared/contracts'

import { useLocalization } from '@app/shared/localization'
import { SpotOptionsFormValues, spotOptionsSchema } from '../services/spotFormSchema'

interface SpotOptionsFormProps {
  defaultValues: SpotOptionsFormValues
  onSubmit: (data: SpotOptionsFormValues) => void
  submitRef?: MutableRefObject<(() => void) | undefined>
}

/** Registers the form's submit handler into an external ref. Must be rendered inside Form context. */
function SubmitBridge({ submitRef, onSubmit }: { submitRef: MutableRefObject<(() => void) | undefined>, onSubmit: (data: SpotOptionsFormValues) => void }) {
  const { handleSubmit } = useFormContext()
  useEffect(() => {
    submitRef.current = handleSubmit(onSubmit)
  })
  return null
}

/**
 * Step 2: Visibility choice and trail assignment.
 * Uses Form + zod schema for validation.
 */
function SpotOptionsForm(props: SpotOptionsFormProps) {
  const { defaultValues, onSubmit, submitRef } = props

  return (
    <Form schema={spotOptionsSchema} defaultValues={defaultValues} onSubmit={onSubmit}>
      {submitRef && <SubmitBridge submitRef={submitRef} onSubmit={onSubmit} />}
      <SpotOptionsFormFields />
    </Form>
  )
}

/** Inner fields rendered inside Form context. */
function SpotOptionsFormFields() {
  const { locales } = useLocalization()
  const { control, watch } = useFormContext()
  const trails = useTrails()
  const visibility = watch('visibility')

  const visibilityOptions = [
    { label: locales.spotCreation.visibilityPreview, value: 'preview' },
    { label: locales.spotCreation.visibilityHidden, value: 'hidden' },
  ]

  const trailOptions = trails.map((trail: Trail) => ({
    label: trail.name,
    value: trail.id,
  }))

  return (
    <Stack spacing="md">
      <FormPicker
        name="visibility"
        label={locales.spotCreation.visibility}
        options={visibilityOptions}
        variant="outlined"
      />
      <Text variant="caption">
        {visibility === 'preview'
          ? locales.spotCreation.visibilityPreviewDescription
          : locales.spotCreation.visibilityHiddenDescription}
      </Text>

      {/* Trail assignment */}
      <Text variant="section">{locales.spotCreation.assignToTrails}</Text>
      {trailOptions.length > 0 ? (
        <Controller
          control={control}
          name="trailIds"
          render={({ field: { value, onChange } }) => (
            <ChipMultiSelect
              options={trailOptions}
              selected={value ?? []}
              onChange={onChange}
            />
          )}
        />
      ) : (
        <Text variant="caption">{locales.spotCreation.noTrailsSelected}</Text>
      )}
    </Stack>
  )
}

export default SpotOptionsForm
