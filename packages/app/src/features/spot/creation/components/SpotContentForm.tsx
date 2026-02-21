import { MutableRefObject, useEffect, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { ContentBlockEditorList, Field, Form, FormInput, Stack } from '@app/shared/components'
import { ContentBlock } from '@shared/contracts'

import { useDeviceLocation } from '@app/features/sensor/stores/sensorStore'
import { useLocalization } from '@app/shared/localization'
import { SpotLocation } from '../../components/SpotLocation'
import { createSpotContentSchema, SpotContentFormValues } from '../services/spotFormSchema'
import SpotCardPicker from './SpotCardPicker'

interface SpotContentFormProps {
  defaultValues: SpotContentFormValues
  onSubmit: (data: SpotContentFormValues) => void
  submitRef?: MutableRefObject<(() => void) | undefined>
}

/** Registers the form's submit handler into an external ref. Must be rendered inside Form context. */
function SubmitBridge({ submitRef, onSubmit }: { submitRef: MutableRefObject<(() => void) | undefined>, onSubmit: (data: SpotContentFormValues) => void }) {
  const { handleSubmit } = useFormContext()
  useEffect(() => {
    submitRef.current = handleSubmit(onSubmit)
  })
  return null
}

/**
 * Step 1: Name, description, photo, and content blocks.
 * Uses Form + zod schema for field validation.
 */
function SpotContentForm(props: SpotContentFormProps) {
  const { defaultValues, onSubmit, submitRef } = props
  const { locales } = useLocalization()

  const schema = useMemo(
    () => createSpotContentSchema(locales.validation),
    [locales],
  )

  return (
    <Form schema={schema} defaultValues={defaultValues} onSubmit={onSubmit}>
      {submitRef && <SubmitBridge submitRef={submitRef} onSubmit={onSubmit} />}
      <SpotContentFormFields />
    </Form>
  )
}

/** Inner fields rendered inside Form context. */
function SpotContentFormFields() {
  const { locales } = useLocalization()
  const { control, watch } = useFormContext()
  const { location } = useDeviceLocation();

  const name = watch('name')
  const imageUri: string | undefined = watch('imageBase64')

  return (
    <Stack spacing="md">
      <Controller
        control={control}
        name="imageBase64"
        render={({ field: { onChange } }) => (
          <SpotCardPicker
            name={name || undefined}
            imageUri={imageUri}
            onChange={onChange}
          />
        )}
      />

      <SpotLocation location={location} style={{ alignSelf: 'center' }} />

      <FormInput
        name="name"
        label={locales.spotCreation.name}
        placeholder={locales.spotCreation.namePlaceholder}
      />

      <FormInput
        name="description"
        label={locales.spotCreation.description}
        placeholder={locales.spotCreation.descriptionPlaceholder}
        multiline
      />

      <Controller
        control={control}
        name="contentBlocks"
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <Field label={locales.contentBlocks.contentBlocks} error={error?.message}>
            <ContentBlockEditorList
              blocks={(value as ContentBlock[]) ?? []}
              onChange={onChange}
            />
          </Field>
        )}
      />
    </Stack>
  )
}

export default SpotContentForm
