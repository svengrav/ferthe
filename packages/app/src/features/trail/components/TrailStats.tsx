import { Icon, Stack, Text } from '@app/shared/components'
import { LoadingSpinner } from '@app/shared/components/activityIndicator/ActivityIndicator'
import { Theme, useTheme } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { StyleSheet, View } from 'react-native'
import { useTrailStats } from '../hooks/useTrailStats'

interface TrailStatsProps {
  trailId: string
}

/**
 * Displays statistics for a trail including progress, rank, and completion status.
 * Encapsulates data fetching and state management via useTrailStats hook.
 */
function TrailStats(props: TrailStatsProps) {
  const { trailId } = props
  const { locales } = useApp(createStyles)
  const { styles, theme } = useTheme(createStyles)
  const { stats, loading, error } = useTrailStats(trailId)

  if (loading) {
    return (
      <View style={styles?.container}>
        <LoadingSpinner />
      </View>
    )
  }

  if (error || !styles) {
    return (
      <View style={styles?.container}>
        <Icon name="warning" size={24} color={theme.colors.error} />
        <Text variant="caption" style={{ color: theme.colors.error }}>
          {error || 'Error loading stats'}
        </Text>
      </View>
    )
  }

  if (!stats) {
    return null
  }

  const getCompletionIcon = () => {
    switch (stats.completionStatus) {
      case 'completed':
        return 'check'
      case 'in_progress':
        return 'clock'
      default:
        return 'circle'
    }
  }

  const getCompletionColor = () => {
    switch (stats.completionStatus) {
      case 'completed':
        return theme.colors.primary
      case 'in_progress':
        return theme.colors.secondary
      default:
        return theme.colors.onSurface
    }
  }

  return (
    <View style={styles.container}>
      {/* Progress */}
      <Stack spacing='lg'>
        <View style={styles.statRow}>
          <Icon name="map" size={20} color={theme.colors.primary} />
          <View style={styles.statContent}>
            <Text variant="caption">{locales.trails.stats.progress}</Text>
            <Text variant="body">
              {stats.discoveredSpots} / {stats.totalSpots} ({stats.progressPercentage}%)
            </Text>
          </View>
        </View>

        {/* Completion Status */}
        <View style={styles.statRow}>
          <Icon name={getCompletionIcon()} size={20} color={getCompletionColor()} />
          <View style={styles.statContent}>
            <Text variant="caption">{locales.trails.stats.status}</Text>
            <Text variant="body" style={{ color: getCompletionColor() }}>
              {locales.trails.stats.completionStatus[stats.completionStatus]}
            </Text>
          </View>
        </View>

        {/* Rank */}
        {stats.rank > 0 && (
          <View style={styles.statRow}>
            <Icon name="trophy" size={20} color={theme.colors.secondary} />
            <View style={styles.statContent}>
              <Text variant="caption">{locales.trails.stats.rank}</Text>
              <Text variant="body">
                #{stats.rank} {locales.trails.stats.of} {stats.totalDiscoverers}
              </Text>
            </View>
          </View>
        )}

        {/* Time Stats */}
        {stats.averageTimeBetweenDiscoveries && (
          <View style={styles.statRow}>
            <Icon name="timer" size={20} color={theme.colors.onSurface} />
            <View style={styles.statContent}>
              <Text variant="caption">{locales.trails.stats.averageTime}</Text>
              <Text variant="body">
                {formatDuration(stats.averageTimeBetweenDiscoveries)}
              </Text>
            </View>
          </View>
        )}
      </Stack>
    </View>
  )
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`
  return `${Math.round(seconds / 86400)}d`
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.tokens.spacing.md,
  },
  statContent: {
    flex: 1,
    gap: theme.tokens.spacing.xs,
  },
})

export default TrailStats
