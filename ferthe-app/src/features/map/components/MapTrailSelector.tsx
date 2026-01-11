import { IconButton, Modal, Text } from '@app/shared/components'
import { createThemedStyles, useThemeStore } from '@app/shared/theme'
import { Trail } from '@shared/contracts'
import React, { useState } from 'react'
import { FlatList, TouchableOpacity, View } from 'react-native'

interface MapTrailSelectorProps {
  trails: Trail[]
  selectedTrail?: Trail
  onSelectTrail: (trail: Trail) => void
}

export const MapTrailSelector = ({ trails, selectedTrail, onSelectTrail }: MapTrailSelectorProps) => {
  const theme = useThemeStore()
  const styles = useStyles(theme)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const toggleSelector = (): void => {
    setIsOpen(!isOpen)
  }

  const handleSelectTrail = (trail: Trail): void => {
    onSelectTrail(trail)
    setIsOpen(false)
  }

  const renderTrailItem = ({ item }: { item: Trail }): React.ReactElement => (
    <TouchableOpacity style={styles.trailItem} onPress={() => handleSelectTrail(item)}>
      <View style={styles.trailInfo}>
        <Text style={styles.trailName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  )

  const renderModal = (): React.ReactElement => (
    <>
      <TouchableOpacity style={styles.selector} onPress={toggleSelector}>
        <View style={styles.selectedTrailDisplay}>
          <Text style={styles.selectedTrailName}>{selectedTrail ? selectedTrail.name : 'change'}</Text>
        </View>
        <IconButton name='expand-more' onPress={toggleSelector} size={16} variant='outlined' />
      </TouchableOpacity>

      <Modal label='Select a Trail' visible={isOpen} onClose={() => setIsOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList data={trails} renderItem={renderTrailItem} keyExtractor={item => item.id} />
          </View>
        </View>
      </Modal>
    </>
  )

  return renderModal()
}

const useStyles = createThemedStyles(theme => ({
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  selector: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    alignSelf: 'center',
  },
  selectedTrailDisplay: {},
  selectedTrailName: {
    fontFamily: theme.text.primary.semiBold,
    fontSize: 12,
    color: theme.colors.onSurface,
  },
  selectedTrailType: {
    fontFamily: theme.text.primary.regular,
    fontSize: 12,
    color: theme.deriveColor(theme.colors.onSurface, 0.7),
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 300,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.deriveColor(theme.colors.divider, 0.3),
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
