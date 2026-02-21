import Field from '@app/shared/components/field/Field'
import Stack from '@app/shared/components/stack/Stack'
import TextInput from '@app/shared/components/textInput/TextInput'
import { useLocalization } from '@app/shared/localization'
import { QuoteBlock } from '@shared/contracts'

interface QuoteBlockEditorProps {
  block: QuoteBlock
  onChange: (block: QuoteBlock) => void
}

function QuoteBlockEditor(props: QuoteBlockEditorProps) {
  const { block, onChange } = props
  const { locales } = useLocalization()

  return (
    <Stack spacing="sm">
      <Field label={locales.contentBlocks.quote}>
        <TextInput
          value={block.data.text}
          onChangeText={(text: string) => onChange({ ...block, data: { ...block.data, text } })}
          placeholder={locales.contentBlocks.quotePlaceholder}
          multiline
          scrollEnabled
        />
      </Field>
      <Field label={locales.contentBlocks.quoteAuthor}>
        <TextInput
          value={block.data.author ?? ''}
          onChangeText={(author: string) => onChange({ ...block, data: { ...block.data, author } })}
          placeholder={locales.contentBlocks.quoteAuthorPlaceholder}
        />
      </Field>
    </Stack>
  )
}

export default QuoteBlockEditor
