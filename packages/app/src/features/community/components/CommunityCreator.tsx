import { View } from 'react-native'

import { Trail } from '@shared/contracts/trails'

import { Button, Picker, Text, TextInput } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'

interface CommunityCreatorProps {
  name: string
  setName: (name: string) => void
  trailId: string
  setTrailId: (trailId: string) => void
  trails: Trail[]
  onCreate: () => void
  disabled: boolean
}

export function CommunityCreator({
  name,
  setName,
  trailId,
  setTrailId,
  trails,
  onCreate,
  disabled,
}: CommunityCreatorProps) {
  const { styles } = useApp(useStyles)

  if (!styles) return null

  const trailOptions = trails.map(trail => ({
    label: trail.name,
    value: trail.id,
  }))

  return (
    <View style={styles.section}>
      <Text variant="heading">Create New Community</Text>
      <View style={styles.inputColumn}>
        <TextInput
          label="Name"
          style={styles.input}
          placeholder="Community Name"
          value={name}
          onChangeText={setName}
        />
        <View>
          <Text variant="body" style={styles.pickerLabel}>Select Trail</Text>
          <Picker
            options={trailOptions}
            selected={trailId}
            onValueChange={setTrailId}
          />
        </View>
        <Button
          align="center"
          label="Create"
          onPress={onCreate}
          disabled={disabled || !name.trim() || !trailId}
        />
      </View>
    </View>
  )
}

const useStyles = createThemedStyles(theme => ({
  section: {
    marginBottom: 24,
  },
  inputColumn: {
    gap: 12,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
    color: theme.colors.onSurface,
  },
  pickerLabel: {
    marginBottom: 4,
    opacity: 0.7,
  },
}))
