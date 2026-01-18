import { getAppContext } from '@app/appContext'
import { useDiscoveryTrail } from '@app/features/discovery'
import { useTrailData } from '@app/features/trail'
import { TrailAvatar } from '@app/features/trail/components/TrailCard'
import { IconButton, Text } from '@app/shared/components'
import { OverlayContent } from '@app/shared/overlay'
import { setOverlay } from '@app/shared/overlay/useOverlayStore'
import { createThemedStyles, useThemeStore } from '@app/shared/theme'
import { Trail } from '@shared/contracts'
import React from 'react'
import { FlatList, TouchableOpacity, View } from 'react-native'

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

    const renderTrailItem = ({ item }: { item: Trail }): React.ReactElement => (
      <TouchableOpacity style={styles.trailItem} onPress={() => handleSelectTrail(item, removeOverlay!)}>
        <View style={styles.trailInfo}>
          <Text style={styles.trailName}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    )

    removeOverlay = setOverlay(
      <OverlayContent title='Select a Trail' variant='page' onClose={() => removeOverlay?.()}>
        <FlatList data={trails} renderItem={renderTrailItem} keyExtractor={item => item.id} />
      </OverlayContent>
    )
  }

  return (
    <TouchableOpacity style={styles.selector} onPress={openTrailSelector}>
      {/* Trail Logo */}
      {selectedTrail && (
        <View style={styles.logoContainer}>
          <TrailAvatar trail={selectedTrail} />
        </View>
      )}
      
      {/* Trail Name */}
      <View style={styles.nameContainer}>
        <Text style={styles.selectedTrailName}>
          {selectedTrail ? selectedTrail.name : 'Select Trail'}
        </Text>
        <Text variant='secondary' size='small'>
           Trail
        </Text>
      </View>
      
      {/* Selector Icon */}
      <View style={styles.iconContainer}>
        <IconButton name='swap-horiz' onPress={openTrailSelector} size={20} variant='outlined' />
      </View>
    </TouchableOpacity>
  )
}

const useStyles = createThemedStyles(theme => ({
  selector: {
    paddingVertical: 8,
    flexDirection: 'row',
    paddingHorizontal: 8,
    alignItems: 'center',
    borderTopColor: theme.colors.divider,
    borderTopWidth: 1,
    gap: 12,
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
    fontFamily: theme.text.primary.semiBold,
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  trailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  trailInfo: {
    flex: 1,
  },
  trailName: {
    fontFamily: theme.text.primary.semiBold,
    fontSize: 14,
    color: theme.colors.onSurface,
  },
}))
