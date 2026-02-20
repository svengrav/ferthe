import { Field, ImagePickerField, Stack, TextInput } from '@app/shared/components'
import { useApp } from '@app/shared/useApp'
import { ImageBlock } from '@shared/contracts'

interface ImageBlockEditorProps {
  block: ImageBlock
  onChange: (block: ImageBlock) => void
}

function ImageBlockEditor(props: ImageBlockEditorProps) {
  const { block, onChange } = props
  const { locales } = useApp()

  return (
    <Stack spacing="sm">
      <ImagePickerField
        value={block.data.imageUrl || undefined}
        onChange={(uri) => onChange({ ...block, data: { ...block.data, imageUrl: uri ?? '' } })}
        label={locales.contentBlocks.image}
        changeLabel={locales.contentBlocks.changeImage}
      />
      <Field label={locales.contentBlocks.imageCaption}>
        <TextInput
          value={block.data.caption ?? ''}
          onChangeText={(caption: string) => onChange({ ...block, data: { ...block.data, caption } })}
          placeholder={locales.contentBlocks.imageCaptionPlaceholder}
        />
      </Field>
    </Stack>
  )
}

export default ImageBlockEditor
