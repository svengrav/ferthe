import { StyleSheet, View } from 'react-native'

import { Theme, useTheme } from '@app/shared/theme'
import { Checkbox } from './Checkbox'

interface CheckboxItem {
  key: string
  label: string
}

interface CheckboxGroupProps<T extends Record<string, boolean> = Record<string, boolean>> {
  items: CheckboxItem[]
  checked: T
  onChange: (checked: T) => void
}

/**
 * Vertical list of checkboxes with toggle behavior.
 */
function CheckboxGroup<T extends Record<string, boolean>>(props: CheckboxGroupProps<T>) {
  const { items, checked, onChange } = props
  const { styles } = useTheme(createStyles)

  const toggle = (key: string) => {
    onChange({ ...checked, [key]: !checked[key] } as T)
  }

  return (
    <View style={styles.list}>
      {items.map(item => (
        <View key={item.key} style={styles.item}>
          <Checkbox
            checked={!!checked[item.key]}
            onPress={() => toggle(item.key)}
            label={item.label}
          />
        </View>
      ))}
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  list: {
    gap: theme.tokens.spacing.md,
  },
  item: {
    paddingVertical: theme.tokens.spacing.xs,
  },
})

export default CheckboxGroup
