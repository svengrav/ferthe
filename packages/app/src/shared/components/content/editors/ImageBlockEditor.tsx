import Field from '@app/shared/components/field/Field'
import ImagePickerField from '@app/shared/components/image/ImagePickerField'
import Stack from '@app/shared/components/stack/Stack'
import TextInput from '@app/shared/components/textInput/TextInput'
import { useLocalization } from '@app/shared/localization'
import { ImageBlock } from '@shared/contracts'

interface ImageBlockEditorProps {
  block: ImageBlock
  onChange: (block: ImageBlock) => void
}

function ImageBlockEditor(props: ImageBlockEditorProps) {
  const { block, onChange } = props
  const { locales } = useLocalization()

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
