import { useThemeStore } from '@app/shared/theme'
import { BottomSheetModal, BottomSheetModalProvider, BottomSheetView } from '@gorhom/bottom-sheet'
import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { StyleSheet } from 'react-native'

interface BottomSheetProps {
  children: React.ReactNode
  initialIndex?: number
  snapPoints?: (string | number)[]
  indicatorColor?: string
  backgroundColor?: string
  onChange?: (index: number) => void
}

export interface BottomSheetRef {
  present: () => void
  dismiss: () => void
}

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    {
      children,
      initialIndex = 0,
      snapPoints: propSnapPoints,
      indicatorColor = '#85858570',
      backgroundColor = '#000000',
      onChange,
    },
    ref
  ) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null)
    const { dimensions } = useThemeStore()

    // Define default snap points if not provided
    const snapPoints = propSnapPoints ?? [dimensions.BOTTOM_SHEET_HEIGHT, dimensions.NAV_HEIGHT]

    // Expose methods to parent components
    useImperativeHandle(ref, () => ({
      present: () => {
        bottomSheetRef.current?.present()
      },
      dismiss: () => {
        bottomSheetRef.current?.dismiss()
      },
    }))

    // Handle index changes
    const handleSheetChanges = useCallback(
      (index: number) => {
        onChange?.(index)
      },
      [onChange]
    )

    return (
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={bottomSheetRef}
          index={initialIndex}
          snapPoints={snapPoints}
          enablePanDownToClose={false}
          handleIndicatorStyle={[styles.indicator, { backgroundColor: indicatorColor }]}
          backgroundStyle={[styles.background, { backgroundColor }]}
          handleStyle={styles.handle}
          style={styles.bottomSheet}
          onChange={handleSheetChanges}>
          <BottomSheetView style={[styles.contentContainer, {}]}>{children}</BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    )
  }
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    zIndex: 100,
    pointerEvents: 'box-none',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  indicator: {
    backgroundColor: '#85858570',
    width: 30,
    height: 2,
  },
  background: {},
  handle: {
    backgroundColor: 'transparent',
  },
  bottomSheet: {
    backgroundColor: 'transparent',
  },
})
