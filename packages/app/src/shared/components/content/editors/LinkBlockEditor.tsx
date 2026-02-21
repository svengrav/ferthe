import Field from '@app/shared/components/field/Field'
import Stack from '@app/shared/components/stack/Stack'
import TextInput from '@app/shared/components/textInput/TextInput'
import { useLocalization } from '@app/shared/localization'
import { LinkBlock } from '@shared/contracts'

interface LinkBlockEditorProps {
  block: LinkBlock
  onChange: (block: LinkBlock) => void
}

function LinkBlockEditor(props: LinkBlockEditorProps) {
  const { block, onChange } = props
  const { locales } = useLocalization()

  return (
    <Stack spacing="sm">
      <Field label={locales.contentBlocks.link}>
        <TextInput
          value={block.data.url}
          onChangeText={(url: string) => onChange({ ...block, data: { ...block.data, url } })}
          placeholder={locales.contentBlocks.linkPlaceholder}
          autoCapitalize="none"
          keyboardType="url"
        />
      </Field>
      <Field label={locales.contentBlocks.linkLabel}>
        <TextInput
          value={block.data.label ?? ''}
          onChangeText={(label: string) => onChange({ ...block, data: { ...block.data, label } })}
          placeholder={locales.contentBlocks.linkLabelPlaceholder}
        />
      </Field>
    </Stack>
  )
}

export default LinkBlockEditor
