import { CreateCommunityInput, createCommunitySchema, Trail } from '@shared/contracts'

import { Form, FormInput, FormPicker, FormSubmitButton, Stack, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'

interface CommunityCreatorProps {
  trails: Trail[]
  onCreate: (data: { name: string; trailId: string }) => void
}

/**
 * Form for creating a new community.
 * Uses Form component with Zod validation.
 */
function CommunityCreator(props: CommunityCreatorProps) {
  const { trails, onCreate } = props
  const { t } = useLocalizationStore()

  const trailOptions = trails.map(trail => ({
    label: trail.name,
    value: trail.id,
  }))

  const handleSubmit = (data: CreateCommunityInput) => {
    onCreate(data)
  }

  return (
    <Stack spacing="lg">
      <Text variant="heading">{t.community.createNewCommunity}</Text>
      <Form
        schema={createCommunitySchema}
        defaultValues={{ name: '', trailId: '' }}
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
          <FormSubmitButton label={t.community.create} />
        </Stack>
      </Form>
    </Stack>
  )
}

export default CommunityCreator
