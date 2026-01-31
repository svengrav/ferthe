import { ReactNode } from 'react'
import { LayoutChangeEvent, View } from 'react-native'
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'

import { getAppContext } from '@app/appContext'
import { ENV } from '@app/env.ts'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { logger } from '@app/shared/utils/logger'

import { useViewportGestures } from '../../hooks/useViewportGestures'
import { getMapState, getViewportActions, useMapSurfaceBoundary, useMapViewport } from '../../stores/mapStore'
import { mapUtils } from '../../utils/geoToScreenTransform'
import { MapViewportDebug } from './MapViewportDebug'

interface MapViewportProps {
  children: ReactNode
  onLayout?: (size: { width: number; height: number }) => void
}

/**
 * MapViewport
 * 
 * Manages a device-centered viewport with fixed radius (default 1000m).
 * Maps geographic area to pixel canvas (default 1000x1000px).
 * Handles gesture interactions and optional debug teleport feature.
 */
function MapViewport(props: MapViewportProps) {
  const { children, onLayout } = props
  const { styles } = useApp(useStyles)
  const { size, boundary } = useMapViewport()
  const surfaceBoundary = useMapSurfaceBoundary()
  const { sensorApplication } = getAppContext()
  const actions = getViewportActions()

  // Handle long press for dev teleport
  const handleLongPress = (x: number, y: number) => {
    if (!surfaceBoundary) return

    const geoPosition = mapUtils.positionToCoordinates({ x, y }, boundary, size)
    logger.log('📍 Teleport to:', geoPosition)
    sensorApplication.setDevice({ location: geoPosition, heading: 0 })
  }

  // Handle gesture end - sync to store
  const handleGestureEnd = (s: number, tx: number, ty: number) => {
    const currentScale = getMapState().viewport.scale
    actions.setViewport({ scale: { ...currentScale, init: s }, offset: { x: tx, y: ty } })
  }

  const { gesture, animatedStyles } = useViewportGestures({
    width: size.width,
    height: size.height,
    elementId: 'device-viewport-content',
    snapToCenter: true,
    onLongPress: ENV.isDevelopment ? handleLongPress : undefined,
    onGestureEnd: handleGestureEnd,
  })

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    onLayout?.({ width, height })
  }

  return (
    <View style={styles?.container} onLayout={handleLayout} id='device-viewport-content'>
      <GestureHandlerRootView style={size}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[size, animatedStyles]}>
            {children}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>

      {ENV.enableMapDebug && <MapViewportDebug animatedStyles={animatedStyles} />}
    </View>
  )
}

const useStyles = createThemedStyles(() => ({
  container: {
    flex: 1,
    position: 'absolute',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
}))

export { MapViewport }

