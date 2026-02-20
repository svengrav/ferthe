import { ContentBlockEditorList, Field, ImagePickerField, Stack, Text, TextInput } from '@app/shared/components'
import { useApp } from '@app/shared/useApp'
import { ContentBlock, SpotContent } from '@shared/contracts'

interface SpotContentFormProps {
  value: SpotContent
  onChange: (content: SpotContent) => void
  contentBlocks?: ContentBlock[]
  onContentBlocksChange?: (blocks: ContentBlock[]) => void
}

/**
 * Step 1: Name, description, and photo for a new spot.
 */
function SpotContentForm(props: SpotContentFormProps) {
  const { value, onChange, contentBlocks, onContentBlocksChange } = props
  const { locales } = useApp()

  return (
    <Stack spacing="md">
      <Field label={locales.spotCreation.name}>
        <TextInput
          value={value.name}
          onChangeText={(name: string) => onChange({ ...value, name })}
          placeholder={locales.spotCreation.namePlaceholder}
        />
      </Field>

      <Field label={locales.spotCreation.description}>
        <TextInput
          value={value.description}
          onChangeText={(description: string) => onChange({ ...value, description })}
          placeholder={locales.spotCreation.descriptionPlaceholder}
          multiline
        />
      </Field>

      <ImagePickerField
        value={value.imageBase64}
        onChange={(uri) => onChange({ ...value, imageBase64: uri })}
        label={locales.spotCreation.addPhoto}
        changeLabel={locales.spotCreation.changePhoto}
        pickButtonLabel={locales.spotCreation.chooseFromGallery}
        changeButtonLabel={locales.spotCreation.changePhoto}
      />

      {onContentBlocksChange && (
        <>
          <Text variant="section">{locales.contentBlocks.contentBlocks}</Text>
          <ContentBlockEditorList
            blocks={contentBlocks ?? []}
            onChange={onContentBlocksChange}
          />
        </>
      )}
    </Stack>
  )
}

export default SpotContentForm
