import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { useTrails } from '@app/features/trail/stores/trailStore'
import { ChipMultiSelect, Form, FormPicker, FormSubmitButton, Stack, Text } from '@app/shared/components'
import { useApp } from '@app/shared/useApp'
import { Trail } from '@shared/contracts'

import { createSpotOptionsSchema, SpotOptionsFormValues } from '../services/spotFormSchema'

interface SpotOptionsFormProps {
  defaultValues: SpotOptionsFormValues
  onSubmit: (data: SpotOptionsFormValues) => void
  submitLabel: string
}

/**
 * Step 2: Visibility choice and trail assignment.
 * Uses Form + zod schema for validation.
 */
function SpotOptionsForm(props: SpotOptionsFormProps) {
  const { defaultValues, onSubmit, submitLabel } = props
  const schema = useMemo(() => createSpotOptionsSchema(), [])

  return (
    <Form schema={schema} defaultValues={defaultValues} onSubmit={onSubmit}>
      <SpotOptionsFormFields submitLabel={submitLabel} />
    </Form>
  )
}

/** Inner fields rendered inside Form context. */
function SpotOptionsFormFields({ submitLabel }: { submitLabel: string }) {
  const { locales } = useApp()
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

      <FormSubmitButton label={submitLabel} />
    </Stack>
  )
}

export default SpotOptionsForm
