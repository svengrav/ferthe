import { Field, Stack, TextInput } from '@app/shared/components'
import { useApp } from '@app/shared/useApp'
import { QuoteBlock } from '@shared/contracts'

interface QuoteBlockEditorProps {
  block: QuoteBlock
  onChange: (block: QuoteBlock) => void
}

function QuoteBlockEditor(props: QuoteBlockEditorProps) {
  const { block, onChange } = props
  const { locales } = useApp()

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
