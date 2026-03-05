import { Button, Chip, ChipMultiSelect, Page, Stack, Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { Theme, useTheme } from '@app/shared/theme'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { StumblePreference } from '@shared/contracts'
import { getStumbleActions, useStumblePreferences } from '../stumbleStore'

const ALL_PREFERENCES: StumblePreference[] = [
  'historical',
  'cafe',
  'art',
  'architecture',
  'nature',
  'street_art',
]

interface StumblePreferencePickerProps {
  onStart: () => void
  onClose: () => void
}

/**
 * Bottom-sheet style picker for selecting Stumble preferences before activation.
 */
export function StumblePreferencePicker({ onStart, onClose }: StumblePreferencePickerProps) {
  const { locales } = useLocalization()
  const { styles } = useTheme(createStyles)
  const selected = useStumblePreferences()
  const { setSelectedPreferences } = getStumbleActions()

  const togglePreference = (pref: StumblePreference) => {
    if (selected.includes(pref)) {
      if (selected.length === 1) return // Always keep at least one
      setSelectedPreferences(selected.filter(p => p !== pref))
    } else {
      setSelectedPreferences([...selected, pref])
    }
  }

  return (
    <View>
      <Stack spacing="lg">
        <Text variant="body">{locales.stumble.preferencesTitle}</Text>

        <View style={styles.grid}>
          <ChipMultiSelect
            options={ALL_PREFERENCES.map(p => ({ value: p, label: locales.stumble.categories[p] }))}
            selected={selected}
            onChange={(selected) => setSelectedPreferences(selected as StumblePreference[])}
          />
        </View>

        <Stack spacing="lg" direction='horizontal' style={{ justifyContent: 'center' }}>
          <Button
            label={locales.common.cancel}
            onPress={onClose}
            variant='secondary'
          />
          <Button
            label={locales.stumble.start}
            variant="primary"
            onPress={onStart}
            disabled={selected.length === 0}
          />
        </Stack>
      </Stack>
    </View>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.tokens.spacing.md,
  },
  chip: {
    paddingVertical: theme.tokens.spacing.sm,
    paddingHorizontal: theme.tokens.spacing.md,
    borderRadius: theme.tokens.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.onSurface,
  },
  chipTextSelected: {
    color: theme.colors.onPrimary,
  },
})
