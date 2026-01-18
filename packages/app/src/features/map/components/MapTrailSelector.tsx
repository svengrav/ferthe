import { getAppContext } from '@app/appContext'
import { useDiscoveryTrail } from '@app/features/discovery'
import { useTrailData } from '@app/features/trail'
import { TrailAvatar } from '@app/features/trail/components/TrailCard'
import { IconButton, Modal, Text } from '@app/shared/components'
import { createThemedStyles, useThemeStore } from '@app/shared/theme'
import { Trail } from '@shared/contracts'
import React, { useState } from 'react'
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
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const toggleSelector = (): void => {
    setIsOpen(!isOpen)
  }

  const handleSelectTrail = (trail: Trail): void => {
    setActiveTrail(trail.id)
    setIsOpen(false)
  }

  const renderTrailItem = ({ item }: { item: Trail }): React.ReactElement => (
    <TouchableOpacity style={styles.trailItem} onPress={() => handleSelectTrail(item)}>
      <View style={styles.trailInfo}>
        <Text style={styles.trailName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  )

  return <>
      <TouchableOpacity style={styles.selector} onPress={toggleSelector}>
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
          <IconButton name='swap-horiz' onPress={toggleSelector} size={20} variant='outlined' />
        </View>
      </TouchableOpacity>

      <Modal label='Select a Trail' visible={isOpen} onClose={() => setIsOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList data={trails} renderItem={renderTrailItem} keyExtractor={item => item.id} />
          </View>
        </View>
      </Modal>
    </>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontFamily: theme.text.primary.semiBold,
    fontSize: 18,
    color: theme.colors.onSurface,
  },
}))
