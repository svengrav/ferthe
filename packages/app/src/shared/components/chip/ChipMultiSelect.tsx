import { StyleSheet, View } from 'react-native'

import Chip from './Chip'

interface ChipOption {
  label: string
  value: string
}

interface ChipMultiSelectProps {
  options: ChipOption[]
  selected: string[]
  onChange: (selected: string[]) => void
}

/**
 * Multi-select chip group with toggle behavior.
 */
function ChipMultiSelect(props: ChipMultiSelectProps) {
  const { options, selected, onChange } = props

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <View style={styles.container}>
      {options.map(option => (
        <Chip
          key={option.value}
          label={option.label}
          variant={selected.includes(option.value) ? 'primary' : 'outlined'}
          onPress={() => toggle(option.value)}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
})

export default ChipMultiSelect
