import { createCommunitySchema, Trail } from '@shared/contracts'

import { Form, FormInput, FormPicker, FormSubmitButton, Stack } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'

interface CommunityEditorProps {
  trails: Trail[]
  initialData?: { name: string; trailId: string }
  onSubmit: (data: { name: string; trailId: string }) => void
}

/**
 * Generic form for community data.
 * Agnostic to create/edit context - parent decides what submit means.
 */
function CommunityEditor(props: CommunityEditorProps) {
  const { trails, initialData, onSubmit } = props
  const { t } = useLocalizationStore()

  const trailOptions = trails.map(trail => ({
    label: trail.name,
    value: trail.id,
  }))

  return (
    <Stack spacing="lg">
      <Form
        schema={createCommunitySchema}
        defaultValues={initialData || { name: '', trailId: '' }}
        onSubmit={onSubmit}>
        <Stack spacing="lg">
          <FormInput
            name="name"
            placeholder={t.community.communityName}
            helperText={t.community.yourCommunityName}
          />
          <FormPicker
            name="trailId"
            options={trailOptions}
            variant='outlined'
            helperText={t.community.selectTrail}
          />
          <FormSubmitButton label={t.common.save} />
        </Stack>
      </Form>
    </Stack>
  )
}

export default CommunityEditor
