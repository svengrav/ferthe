import { useTrails } from '@app/features/trail/stores/trailStore'
import { ChipMultiSelect, Picker, Stack, Text } from '@app/shared/components'
import { useApp } from '@app/shared/useApp'
import { SpotVisibility, Trail } from '@shared/contracts'

interface SpotOptionsFormProps {
  visibility: SpotVisibility
  selectedTrailIds: string[]
  onVisibilityChange: (visibility: SpotVisibility) => void
  onTrailIdsChange: (trailIds: string[]) => void
}

/**
 * Step 2: Visibility choice and trail assignment.
 */
function SpotOptionsForm(props: SpotOptionsFormProps) {
  const { visibility, selectedTrailIds, onVisibilityChange, onTrailIdsChange } = props
  const { locales } = useApp()
  const trails = useTrails()

  const visibilityOptions = [
    { label: locales.spotCreation.visibilityPreview, value: 'preview' },
    { label: locales.spotCreation.visibilityHidden, value: 'hidden' },
  ]

  const trailOptions = trails.map((trail: Trail) => ({
    label: trail.name,
    value: trail.id,
  }))

  return (
    <Stack spacing="md">
      {/* Visibility */}
      <Text variant="section">{locales.spotCreation.visibility}</Text>
      <Picker
        options={visibilityOptions}
        selected={visibility}
        onValueChange={(value) => onVisibilityChange(value as SpotVisibility)}
        variant="outlined"
      />
      <Text variant="caption">
        {visibility === 'preview'
          ? locales.spotCreation.visibilityPreviewDescription
          : locales.spotCreation.visibilityHiddenDescription}
      </Text>

      {/* Trail assignment */}
      <Text variant="section">{locales.spotCreation.assignToTrails}</Text>
      {trailOptions.length > 0 ? (
        <ChipMultiSelect
          options={trailOptions}
          selected={selectedTrailIds}
          onChange={onTrailIdsChange}
        />
      ) : (
        <Text variant="caption">{locales.spotCreation.noTrailsSelected}</Text>
      )}
    </Stack>
  )
}

export default SpotOptionsForm
