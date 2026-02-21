import { FlatList, StyleSheet, View } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'

import { useDiscoveryTrail } from '@app/features/discovery'
import { useTrails } from '@app/features/trail'
import TrailItem from '@app/features/trail/components/TrailItem'
import { getTrailsById } from '@app/features/trail/stores/trailStore'
import { Button } from '@app/shared/components'
import { OverlayCard, closeOverlay, setOverlay } from '@app/shared/overlay'
import { Theme, useTheme } from '@app/shared/theme'
import { Trail } from '@shared/contracts'

import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { useSwipeUpGesture } from '../hooks/useSwipeUpGesture'

/**
 * Hook to open/close the trail list card overlay.
 */
export const useMapTrailListCard = () => {
  const trails = useTrails()
  const { discoveryApplication } = getAppContextStore()

  return {
    showTrailListCard: () => {
      const cardId = 'map-trail-list-card'
      return setOverlay(
        cardId,
        <MapTrailListCard
          onClose={() => closeOverlay('map-trail-list-card')}
          trails={trails}
          onSelectTrail={(trail) => {
            discoveryApplication.setActiveTrail(trail.id)
            closeOverlay(cardId)
          }}
        />,
      )
    },
    closeTrailListCard: () => closeOverlay('map-trail-list-card'),
  }
}

interface MapTrailListCardProps {
  trails: Trail[]
  onSelectTrail: (trail: Trail) => void
  onClose: () => void
}

/**
 * Overlay card displaying a list of available trails for selection.
 */
function MapTrailListCard(props: MapTrailListCardProps) {
  const { trails, onSelectTrail, onClose } = props
  const { styles } = useTheme(createStyles)

  const renderTrailItem = ({ item }: { item: Trail }) => (
    <TrailItem
      trail={item}
      onPress={() => onSelectTrail(item)}
    />
  )

  return (
    <OverlayCard title='Select card' onClose={onClose} inset='none'>
      <FlatList
        data={trails}
        renderItem={renderTrailItem}
        keyExtractor={item => item.id}
      />
    </OverlayCard>
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
 * Displays the currently active trail and allows swipe-up gesture to open trail list.
 */
export const MapTrailSelector = () => {
  const { styles } = useTheme(createStyles)
  const { selectedTrail, openTrailSelector } = useMapTrailSelector()
  const swipeGesture = useSwipeUpGesture(openTrailSelector)

  return (
    <GestureDetector gesture={swipeGesture} >
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
    borderTopColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,

  },
})
