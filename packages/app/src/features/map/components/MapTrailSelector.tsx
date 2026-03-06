import { FlatList, StyleSheet, View } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import { useLocalization } from '@app/shared/localization'

import { useDiscoveryTrail } from '@app/features/discovery'
import { useTrails } from '@app/features/trail'
import TrailItem from '@app/features/trail/components/TrailItem'
import { getTrailsById } from '@app/features/trail/stores/trailStore'
import { Button } from '@app/shared/components'
import { OverlayCard, closeOverlay, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'
import { Trail } from '@shared/contracts'

import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { isStumbleTrail } from '@app/features/stumble'
import { useSwipeUpGesture } from '../hooks/useSwipeUpGesture'
import TrailList from '@app/features/trail/components/TrailList'

/**
 * Hook to open/close the trail list card overlay.
 */
export const useMapTrailListCard = () => {
  const trails = useTrails()
  const { discoveryApplication, stumbleApplication } = getAppContextStore()
  const { locales } = useLocalization()

  return {
    showTrailListCard: () => {
      const cardId = 'map-trail-list-card'
      return setOverlay(
        cardId,
        <OverlayCard title={locales.map.selectTrail} onClose={() => closeOverlay(cardId)} >
          <MapTrailListCard
            onClose={() => closeOverlay(cardId)}
            trails={trails}
            onSelectTrail={(trail) => {
              closeOverlay(cardId)
              discoveryApplication.setActiveTrail(trail.id)

            }}
          />
        </OverlayCard>
      )
    },
  }
}

interface MapTrailListCardProps {
  trails: Trail[]
  onSelectTrail: (trail: Trail) => void
  onClose: () => void
}

/**
 * Overlay card displaying all available trails for selection.
 * Stumble trails (kind='stumble') are managed in the backend like any other trail.
 */
function MapTrailListCard({ trails, onSelectTrail, onClose }: MapTrailListCardProps) {

  return (
    <TrailList
      trails={trails}
      onOpenTrail={(item) => onSelectTrail(item)}
    />
  )
}

/**
 * Hook to manage trail selector state and interactions.
 */
const useMapTrailSelector = () => {
  const activeTrail = useDiscoveryTrail()
  const trailsById = getTrailsById()
  const { showTrailListCard } = useMapTrailListCard()

  return {
    selectedTrail: activeTrail?.trailId ? trailsById[activeTrail.trailId] : undefined,
    openTrailSelector: showTrailListCard,
  }
}

/**
 * Bottom sheet selector for switching between trails on the map.
 * Supports swipe-up gesture to open the trail list.
 */
export const MapTrailSelector = () => {
  const { styles } = useTheme(createStyles)
  const { selectedTrail, openTrailSelector } = useMapTrailSelector()
  const swipeGesture = useSwipeUpGesture(openTrailSelector)

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={styles.selector} id="map">
        {selectedTrail && (
          <TrailItem
            trail={selectedTrail}
            onPress={openTrailSelector}
            actions={
              <Button
                icon='swap-horiz'
                onPress={openTrailSelector}
                variant='outlined'
              />
            }
          />
        )}
      </View>
    </GestureDetector>
  )
}

const createStyles = (theme: Theme) => StyleSheet.create({
  selector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.colors.background
  },
})
