import { Button, Chip, ChipMultiSelect, Page, Stack, Text } from '@app/shared/components'
import { useLocalization } from '@app/shared/localization'
import { Theme, useTheme } from '@app/shared/theme'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { StumblePreference, StumblePreferenceSet } from '@shared/contracts'
import { getStumbleActions, useStumblePreferences } from '../stumbleStore'
import { closeOverlay, OverlayCard, setOverlay } from '@app/shared/overlay'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { getDeviceLocation } from '@app/features/sensor/'

const PICKER_KEY = 'stumble-preferences'

export const useStumblePanel = () => {
  const { locales } = useLocalization()

  return {
    openStumblePanel: () => (setOverlay(
      PICKER_KEY,
      <OverlayCard title={locales.stumble.title} onClose={() => closeOverlay(PICKER_KEY)}>
        <StumblePreferencePicker />
      </OverlayCard>
    )),
    closeStumblePanel: () => closeOverlay(PICKER_KEY),
  }
}

/**
 * Bottom-sheet style picker for selecting Stumble preferences before activation.
 */
export function StumblePreferencePicker() {
  const { locales } = useLocalization()
  const { styles } = useTheme(createStyles)
  const selected = useStumblePreferences()
  const { setSelectedPreferences } = getStumbleActions()
  const { location } = getDeviceLocation()

  const { stumbleApplication } = getAppContextStore()

  const onStartHandler = () => {
    stumbleApplication.fetchSuggestions(location.lat, location.lon)
    closeOverlay(PICKER_KEY)
  }

  return (
    <Stack spacing="lg">
      <Text variant="body">{locales.stumble.preferencesTitle}</Text>

      <View style={styles.grid}>
        <ChipMultiSelect
          options={StumblePreferenceSet.map(p => ({ value: p, label: locales.stumble.categories[p] }))}
          selected={selected}
          onChange={(selected) => setSelectedPreferences(selected as StumblePreference[])}
        />
      </View>

      <Stack spacing="lg" direction='horizontal' style={{ justifyContent: 'center' }}>
        <Button
          label={locales.stumble.start}
          variant="primary"
          onPress={onStartHandler}
          disabled={selected.length === 0}
        />
      </Stack>
    </Stack>
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
