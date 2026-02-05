import { StyleSheet, View } from 'react-native'

import { CreateCommunityInput, createCommunitySchema, Trail } from '@shared/contracts'

import { Form, FormInput, FormPicker, FormSubmitButton, Text } from '@app/shared/components'
import { useLocalizationStore } from '@app/shared/localization/useLocalizationStore'
import { Theme, useTheme } from '@app/shared/theme'

interface CommunityCreatorProps {
  trails: Trail[]
  onCreate: (data: { name: string; trailId: string }) => void
  disabled: boolean
}

/**
 * Form for creating a new community.
 * Uses Form component with Zod validation.
 */
function CommunityCreator(props: CommunityCreatorProps) {
  const { trails, onCreate, disabled } = props

  const { styles } = useTheme(createStyles)
  const { t } = useLocalizationStore()

  const trailOptions = trails.map(trail => ({
    label: trail.name,
    value: trail.id,
  }))

  const handleSubmit = (data: CreateCommunityInput) => {
    onCreate(data)
  }

  return (
    <View style={styles.section}>
      <Text variant="heading">Create New Community</Text>
      <Form
        schema={createCommunitySchema}
        defaultValues={{ name: '', trailId: '' }}
        onSubmit={handleSubmit}>
        <View style={styles.inputColumn}>
          <FormInput
            name="name"
            placeholder={t.community.communityName}
            helperText={t.community.yourCommunityName}

          />
          <FormPicker
            name="trailId"
            label={t.community.selectTrail}
            options={trailOptions}
            variant='outlined'
          />
          <FormSubmitButton label={t.community.create} />
        </View>
      </Form>
    </View>
  )
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    section: {
      marginBottom: 24,
    },
    inputColumn: {
      gap: 12,
    },
  })

export default CommunityCreator
