import { createContext, ReactNode, useContext } from 'react'
import { LayoutChangeEvent, View } from 'react-native'
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { SharedValue } from 'react-native-reanimated'

import { getAppContext } from '@app/appContext'
import { config } from '@app/config'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { logger } from '@app/shared/utils/logger'

import { useViewportGestures } from '../../hooks/useViewportGestures'
import { getMapState, getViewportActions, useMapSurfaceBoundary, useMapViewport } from '../../stores/mapStore'
import { mapUtils } from '../../utils/geoToScreenTransform'
import { MapViewportDebug } from './MapViewportDebug'

// Context for compensated scale
const CompensatedScaleContext = createContext<SharedValue<number> | null>(null)

/**
 * Provider component for compensated scale context
 * Exported for use in MapOverlay
 */
export const CompensatedScaleProvider = CompensatedScaleContext.Provider

/**
 * Hook to access compensated scale for map elements
 * Works in both MapViewport and MapOverlay contexts
 */
export const useCompensatedScale = (): SharedValue<number> => {
  const context = useContext(CompensatedScaleContext)
  if (!context) {
    throw new Error('useCompensatedScale must be used within CompensatedScaleProvider')
  }
  return context
}

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

  const viewportScale = getMapState().viewport.scale

  const { gesture, animatedStyles, compensatedScale } = useViewportGestures({
    width: size.width,
    height: size.height,
    initialScale: viewportScale.init,
    minScale: viewportScale.min,
    maxScale: viewportScale.max,
    elementId: 'device-viewport-content',
    snapToCenter: true,
    onLongPress: config.environment === 'development' ? handleLongPress : undefined,
    onGestureEnd: handleGestureEnd,
  })

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    onLayout?.({ width, height })
  }

  return (
    <CompensatedScaleContext.Provider value={compensatedScale}>
      <View style={styles?.container} onLayout={handleLayout} id='device-viewport-content'>
        <GestureHandlerRootView style={size}>
          <GestureDetector gesture={gesture}>
            <Animated.View style={[size, animatedStyles, { overflow: 'hidden' }]}>
              {children}
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>

        {config.debug.enableMapDebug && <MapViewportDebug animatedStyles={animatedStyles} />}
      </View>
    </CompensatedScaleContext.Provider>
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
    overflow: 'hidden'
  },
}))

export { MapViewport }

