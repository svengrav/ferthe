import { getAppContext } from '@app/appContext'
import { useDiscoveryTrail } from '@app/features/discovery'
import { useTrailData } from '@app/features/trail'
import { BottomSheet, BottomSheetRef, Text } from '@app/shared/components'
import { createThemedStyles, useThemeStore } from '@app/shared/theme'
import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import { MapTrailSelector } from './MapTrailSelector'

const BOTTOM_SHEET_HEIGHT_MIN = 80
const BOTTOM_SHEET_HEIGHT_MAX = 140

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

export const MapBottomSheet = () => {
  const { trails, activeTrail, setActiveTrail } = useMapBottomSheet()
  const theme = useThemeStore()
  const styles = useStyles(theme)
  const bottomSheetRef = useRef<BottomSheetRef>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      bottomSheetRef.current?.present()
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      { /* Spacer to push the bottom sheet above the map */}
      <View style={{ height: BOTTOM_SHEET_HEIGHT_MIN }} />
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={[BOTTOM_SHEET_HEIGHT_MIN, BOTTOM_SHEET_HEIGHT_MAX]}
        indicatorColor={'#ffffff81'}>
        <View style={styles.bottomContainer}>
          <View style={styles.header}>
            <View style={styles.labelContainer}>
              <Text style={styles.titel}>{activeTrail.trail?.name}</Text>
              <Text style={styles.subtitle}>Trail</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <MapTrailSelector
              trails={trails}
              selectedTrail={activeTrail?.trail}
              onSelectTrail={trail => setActiveTrail(trail.id)}
            />
          </View>
        </View>
      </BottomSheet>
    </>
  )
}

const useStyles = createThemedStyles(theme => ({
  bottomContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  header: {
    height: 56, // Standard Material Design header height
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  titel: {
    fontFamily: theme.text.primary.semiBold,
    fontSize: 17,
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: 'condensed',
    color: theme.deriveColor(theme.colors.onBackground, 0.5),
  },

  label: {
    ...theme.text.size.lg,
    fontFamily: theme.text.primary.semiBold,
    color: theme.colors.onBackground,
    textAlign: 'center',
  },

  labelContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconButton: {},
}))

