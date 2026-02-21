import { Icon, ProgressBar, Stack, Text } from '@app/shared/components'
import { LoadingSpinner } from '@app/shared/components/activityIndicator/ActivityIndicator'
import { useLocalization } from '@app/shared/localization'
import { Theme, useTheme } from '@app/shared/theme'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { useDiscoveryStats } from '../hooks/useDiscoveryStats'

interface DiscoveryStatsProps {
  discoveryId: string
  animationDelay?: number
  style?: StyleProp<ViewStyle>
}

/**
 * Displays statistics for a discovery including rank, trail position, and distance/time from last discovery.
 * Encapsulates data fetching and state management via useDiscoveryStats hook.
 */
function DiscoveryStats(props: DiscoveryStatsProps) {
  const { discoveryId, animationDelay = 0, style } = props
  const { locales } = useLocalization()
  const { styles, theme } = useTheme(createStyles)
  const { stats, loading, error } = useDiscoveryStats(discoveryId)

  if (loading) {
    return (
      <View style={[styles?.container, style]}>
        <LoadingSpinner />
      </View>
    )
  }

  if (error || !styles) {
    return (
      <View style={[styles?.container, style]}>
        <Icon name="warning" size='lg' color={theme.colors.error} />
        <Text variant="caption" style={{ color: theme.colors.error }}>
          {error || 'Error loading stats'}
        </Text>
      </View>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <View style={[styles.container, style]}>
      <Stack spacing='lg'>
        <Text variant="section">{locales.discovery.stats.name}</Text>

        {/* Rank */}
        <View style={styles.statRow}>
          <Icon name="trophy" size='md' color={theme.colors.primary} />
          <View style={styles.statContent}>
            <Text variant="caption">{locales.discovery.stats.rank}</Text>
            <Text variant="body">
              {stats.rank} {locales.discovery.stats.of} {stats.totalDiscoverers}
            </Text>
            <ProgressBar
              percentage={(stats.rank / stats.totalDiscoverers) * 100}
              color={theme.colors.primary}
              delay={animationDelay}
            />
          </View>
        </View>

        {/* Trail Position */}
        <View style={styles.statRow}>
          <Icon name="map" size='md' color={theme.colors.secondary} />
          <View style={styles.statContent}>
            <Text variant="caption">{locales.discovery.stats.trailPosition}</Text>
            <Text variant="body">
              {stats.trailPosition} / {stats.trailTotal}
            </Text>
            <ProgressBar
              percentage={(stats.trailPosition / stats.trailTotal) * 100}
              color={theme.colors.secondary}
              delay={animationDelay}
            />
          </View>
        </View>

        {/* Time Since Last Discovery */}
        <View style={styles.statRow}>
          <Icon name="timer" size='md' color={theme.colors.onSurface} />
          <View style={styles.statContent}>
            <Text variant="caption">{locales.discovery.stats.timeSinceLast}</Text>
            <Text variant="body">
              {stats.timeSinceLastDiscovery !== undefined ? formatDuration(stats.timeSinceLastDiscovery) : '-'}
            </Text>
          </View>
        </View>

        {/* Distance From Last Discovery */}
        <View style={styles.statRow}>
          <Icon name="near-me" size='md' color={theme.colors.onSurface} />
          <View style={styles.statContent}>
            <Text variant="caption">{locales.discovery.stats.distanceFromLast}</Text>
            <Text variant="body">
              {stats.distanceFromLastDiscovery !== undefined ? formatDistance(stats.distanceFromLastDiscovery) : '-'}
            </Text>
          </View>
        </View>
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

const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.tokens.spacing.lg,
  },
  statContent: {
    flex: 1,
    gap: theme.tokens.spacing.xs,
    paddingRight: theme.tokens.spacing.sm,
  },
})

export default DiscoveryStats
