import { useEffect, useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { StyleSheet, View } from 'react-native'

import { Button, ContentBlockEditorList, Field, Form, FormInput, FormSubmitButton, Stack } from '@app/shared/components'
import { useImagePicker } from '@app/shared/hooks/useImagePicker'
import { useApp } from '@app/shared/useApp'
import { ContentBlock } from '@shared/contracts'

import SpotCard from '../card/SpotCard'
import { createSpotContentSchema, SpotContentFormValues } from './spotFormSchema'

interface SpotContentFormProps {
  defaultValues: SpotContentFormValues
  onSubmit: (data: SpotContentFormValues) => void
  submitLabel: string
}

/**
 * Step 1: Name, description, photo, and content blocks.
 * Uses Form + zod schema for field validation.
 */
function SpotContentForm(props: SpotContentFormProps) {
  const { defaultValues, onSubmit, submitLabel } = props
  const { locales } = useApp()

  const schema = useMemo(
    () => createSpotContentSchema(locales.validation),
    [locales],
  )

  return (
    <Form schema={schema} defaultValues={defaultValues} onSubmit={onSubmit}>
      <SpotContentFormFields submitLabel={submitLabel} />
    </Form>
  )
}

/** Inner fields rendered inside Form context. */
function SpotContentFormFields({ submitLabel }: { submitLabel: string }) {
  const { locales } = useApp()
  const { control, watch } = useFormContext()

  const name = watch('name')
  const imageUri: string | undefined = watch('imageBase64')
  const previewImage = imageUri ? { id: 'preview', url: imageUri } : undefined

  return (
    <Stack spacing="md">
      {/* Live spot card preview with integrated image picker */}
      <Controller
        control={control}
        name="imageBase64"
        render={({ field: { onChange } }) => (
          <SpotCardImagePicker
            name={name}
            imageUri={imageUri}
            previewImage={previewImage}
            onChange={onChange}
          />
        )}
      />

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

      <FormSubmitButton label={submitLabel} />
    </Stack>
  )
}

/** SpotCard with image picker. Syncs picked image URI into form field. */
function SpotCardImagePicker({ name, imageUri, previewImage, onChange }: {
  name: string
  imageUri?: string
  previewImage?: { id: string; url: string }
  onChange: (value: string | undefined) => void
}) {
  const { locales } = useApp()
  const { selectedImageUri, pickImage } = useImagePicker()

  // Sync picked image into form field
  useEffect(() => {
    if (selectedImageUri) onChange(selectedImageUri)
  }, [selectedImageUri])

  return (
    <View style={styles.cardContainer}>
      <SpotCard
        width={300}
        height={500}
        title={name || undefined}
        image={previewImage}
      >
        {!imageUri && (
          <Button
            icon="image"
            label={locales.spotCreation.addPhoto}
            variant="outlined"
            onPress={pickImage}
          />
        )}
      </SpotCard>
      {imageUri && (
        <View style={styles.changePhotoRow}>
          <Button
            label={locales.spotCreation.changePhoto}
            variant="outlined"
            size="sm"
            onPress={pickImage}
          />
          <Button
            icon="close"
            variant="outlined"
            size="sm"
            onPress={() => onChange(undefined)}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  cardContainer: {
    alignItems: 'center',
    gap: 8,
  },
  changePhotoRow: {
    flexDirection: 'row',
    gap: 8,
  },
})

export default SpotContentForm
