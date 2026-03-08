import { useDiscoveryTrailId } from '@app/features/discovery/stores/discoveryTrailStore'
import { useIsStumbleTrail } from '@app/features/stumble'
import { useStumblePanel } from '@app/features/stumble/components/StumblePreferencePicker'
import { Button } from '@app/shared/components'
import { getAppContextStore } from '@app/shared/stores/appContextStore'
import { Theme, useTheme } from '@app/shared/theme'
import { StyleSheet } from 'react-native'
import { MapScannerControl } from './MapScanner'
import MapToolbar from './MapToolbar'


/**
 * General bottom toolbar for the map — always visible when a trail is active.
 */
export function MapBottomBar() {
  const { styles } = useTheme(createStyles)
  const isStumbleActive = useIsStumbleTrail()
  const trailId = useDiscoveryTrailId()
  const { sensorApplication } = getAppContextStore()
  const { openStumblePanel } = useStumblePanel()

  const leadingSlot = isStumbleActive ? <Button icon='pin-drop' onPress={openStumblePanel} /> : undefined
  const scanner = <MapScannerControl startScan={() => trailId && sensorApplication.startScan(trailId)} />

  return (
    <MapToolbar
      style={styles.toolbar}
      leading={leadingSlot}
      center={isStumbleActive ? undefined : scanner}
      trailing={isStumbleActive ? scanner : undefined}
    />
  )
}

const createStyles = (_theme: Theme) => StyleSheet.create({
  toolbar: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
})
