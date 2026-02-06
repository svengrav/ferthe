import { CreateCommunityInput, createCommunitySchema, Trail } from '@shared/contracts'

import { Form, FormInput, FormPicker, FormSubmitButton, Stack, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'

interface CommunityCreatorProps {
  trails: Trail[]
  mode?: 'create' | 'edit'
  initialData?: { name: string; trailId: string; communityId?: string }
  onCreate?: (data: { name: string; trailId: string }) => void
  onUpdate?: (data: { name: string; trailId: string; communityId: string }) => void
}

/**
 * Form for creating or editing a community.
 * Uses Form component with Zod validation.
 */
function CommunityCreator(props: CommunityCreatorProps) {
  const { trails, mode = 'create', initialData, onCreate, onUpdate } = props
  const { t } = useLocalizationStore()

  const trailOptions = trails.map(trail => ({
    label: trail.name,
    value: trail.id,
  }))

  const handleSubmit = (data: CreateCommunityInput) => {
    if (mode === 'edit' && onUpdate && initialData?.communityId) {
      onUpdate({ ...data, communityId: initialData.communityId })
    } else if (mode === 'create' && onCreate) {
      onCreate(data)
    }
  }

  return (
    <Stack spacing="lg">
      <Text variant="heading">
        {mode === 'edit' ? 'Edit Community' : t.community.createNewCommunity}
      </Text>
      <Form
        schema={createCommunitySchema}
        defaultValues={initialData || { name: '', trailId: '' }}
        onSubmit={handleSubmit}>
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

export default CommunityCreator
