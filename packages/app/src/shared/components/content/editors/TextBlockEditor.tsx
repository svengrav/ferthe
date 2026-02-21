import Field from '@app/shared/components/field/Field'
import TextInput from '@app/shared/components/textInput/TextInput'
import { useLocalization } from '@app/shared/localization'
import { TextBlock } from '@shared/contracts'

interface TextBlockEditorProps {
  block: TextBlock
  onChange: (block: TextBlock) => void
}

function TextBlockEditor(props: TextBlockEditorProps) {
  const { block, onChange } = props
  const { locales } = useLocalization()

  return (
    <Field label={locales.contentBlocks.text}>
      <TextInput
        value={block.data.text}
        onChangeText={(text: string) => onChange({ ...block, data: { ...block.data, text } })}
        placeholder={locales.contentBlocks.textPlaceholder}
        multiline
        scrollEnabled
      />
    </Field>
  )
}

export default TextBlockEditor
