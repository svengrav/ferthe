import { Text } from '@app/shared/components'
import { Theme, useTheme } from '@app/shared/theme'
import { StumbleSuggestion } from '@shared/contracts'
import { useEffect, useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { useMapCanvas } from '../../stores/mapStore'
import { mapUtils } from '../../services/geoToScreenTransform'
import { useCreateSpotPage } from '@app/features/spot/creation/components/SpotCreationPage'
import { useStumbleActive, useStumbleSuggestions } from '@app/features/stumble/stumbleStore'

const MARKER_SIZE = 40
const MARKER_OFFSET = MARKER_SIZE / 2

/**
 * Renders Stumble Mode suggestion markers on the map canvas.
 * Only visible when Stumble Mode is active.
 */
export function MapStumbleOverlay() {
  const isActive = useStumbleActive()
  const suggestions = useStumbleSuggestions()
  const { boundary, size } = useMapCanvas()

  const positions = useMemo(() =>
    suggestions.map(s => ({
      suggestion: s,
      position: mapUtils.coordinatesToPosition(s.location, boundary, size),
    })),
    [suggestions, boundary, size.width, size.height]
  )

  if (!isActive || positions.length === 0) return null

  return (
    <>
      {positions.map(({ suggestion, position }) => (
        <StumbleMarker
          key={suggestion.id}
          suggestion={suggestion}
          x={position.x}
          y={position.y}
        />
      ))}
    </>
  )
}

// ──────────────────────────────────────────────────────────────
// Single pulsing marker
// ──────────────────────────────────────────────────────────────

interface StumbleMarkerProps {
  suggestion: StumbleSuggestion
  x: number
  y: number
}

function StumbleMarker({ suggestion, x, y }: StumbleMarkerProps) {
  const { styles } = useTheme(createStyles)
  const { showCreateSpotPage } = useCreateSpotPage()

  const scale = useSharedValue(1)

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
      false,
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Pressable
      onPress={() => showCreateSpotPage(suggestion.location)}
      style={[
        styles.wrapper,
        { position: 'absolute', left: x - MARKER_OFFSET, top: y - MARKER_OFFSET },
      ]}
    >
      <Animated.View style={[styles.marker, animatedStyle]}>
        <Text variant="caption" style={styles.label}>✦</Text>
      </Animated.View>
      <View style={styles.nameTag}>
        <Text variant="caption" style={styles.name} numberOfLines={1}>
          {suggestion.name}
        </Text>
      </View>
    </Pressable>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    zIndex: 200,
  },
  marker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  label: {
    color: theme.colors.onSecondary,
    fontSize: 16,
  },
  nameTag: {
    marginTop: 4,
    backgroundColor: theme.deriveColor(theme.colors.surface, 0.9),
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 120,
  },
  name: {
    color: theme.colors.onSurface,
    fontSize: 10,
  },
})
