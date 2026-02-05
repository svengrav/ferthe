import { getAppContext } from '@app/appContext'
import { useDiscoveryTrail } from '@app/features/discovery'
import { useTrailData } from '@app/features/trail'
import TrailItem from '@app/features/trail/components/TrailItem'
import { Button } from '@app/shared/components'
import { setOverlay } from '@app/shared/overlay/useOverlayStore'
import { createThemedStyles, useThemeStore } from '@app/shared/theme'
import { Trail } from '@shared/contracts'
import React from 'react'
import { FlatList, View } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import { useSwipeUpGesture } from '../hooks/useSwipeUpGesture'

const useMapBottomSheet = () => {
  const { trails } = useTrailData()
  const activeTrail = useDiscoveryTrail()
  const { discoveryApplication } = getAppContext()
  return {
    trails,
    activeTrail,
    setActiveTrail: discoveryApplication.setActiveTrail,
  }
}

export const MapTrailSelector = () => {
  const { trails, activeTrail, setActiveTrail } = useMapBottomSheet()
  const selectedTrail = activeTrail?.trail
  const theme = useThemeStore()
  const styles = useStyles(theme)

  const handleSelectTrail = (trail: Trail, closeOverlay: () => void): void => {
    setActiveTrail(trail.id)
    closeOverlay()
  }

  const openTrailSelector = (): void => {
    let removeOverlay: (() => void) | undefined

    const renderTrailItem = ({ item }: { item: Trail }): React.ReactElement => {
      const isActive = item.id === activeTrail?.trail?.id

      return (
        <TrailItem
          trail={item}
          onPress={() => handleSelectTrail(item, removeOverlay!)}
        />
      )
    }

    removeOverlay = setOverlay('trailSelector',
      <FlatList
        data={trails}
        renderItem={renderTrailItem}
        contentContainerStyle={{ gap: 12 }}
        keyExtractor={item => item.id} />,
      {
        title: 'Select a Trail',
        variant: 'compact',
        closable: true
      }
    )
  }
  const swipeGesture = useSwipeUpGesture(openTrailSelector)

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={styles.selector}>
        {selectedTrail && (
          <TrailItem
            trail={selectedTrail}
            onPress={openTrailSelector}
            actions={
              <Button
                icon='swap-horiz'
                onPress={openTrailSelector}
                variant='outlined' />
            } />
        )}
      </View>
    </GestureDetector>
  )
}

const useStyles = createThemedStyles(theme => ({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    padding: 8,
  },
  logoContainer: {
    width: 50,
    height: 50,
  },
  nameContainer: {
    flex: 1,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTrailName: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  trailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    gap: 12,
  },
  trailItemActive: {
    backgroundColor: theme.colors.surface,
  },
  avatarContainer: {
    width: 50,
    height: 50,
  },
  trailInfo: {
    flex: 1,
  },
}))
