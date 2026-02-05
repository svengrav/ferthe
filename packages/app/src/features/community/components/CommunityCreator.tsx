import { StyleSheet, View } from 'react-native'

import { CreateCommunityInput, createCommunitySchema, Trail } from '@shared/contracts'

import { Form, FormInput, FormPicker, FormSubmitButton, Text } from '@app/shared/components'
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
            placeholder="Community Name"
            helperText="Your Community Name"

          />
          <FormPicker
            name="trailId"
            label="Select Trail"
            options={trailOptions}
            variant='outlined'
          />
          <FormSubmitButton label="Create" />
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
