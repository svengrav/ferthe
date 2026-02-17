import { ReactNode } from 'react'
import { LayoutChangeEvent, View } from 'react-native'
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'

import { getAppContext } from '@app/appContext'
import { config } from '@app/config'
import { Image } from '@app/shared/components'
import { createThemedStyles } from '@app/shared/theme'
import { useApp } from '@app/shared/useApp'
import { logger } from '@app/shared/utils/logger'

import { getMapThemeDefaults } from '../../config/mapThemeDefaults.ts'
import { useViewportGestures } from '../../hooks/useViewportGestures.ts'
import { getMapCanvasActions, getMapState, useMapCanvas, useMapSurfaceBoundary } from '../../stores/mapStore.ts'
import { mapUtils } from '../../utils/geoToScreenTransform.ts'
import { MapCanvasDebug } from './MapCanvasDebug.tsx'
import { MapScaleProvider } from './MapCompensatedScale.tsx'

interface MapCanvasViewportProps {
  children: ReactNode
  onLayout?: (size: { width: number; height: number }) => void
}

/**
 * MapCanvas
 * 
 * Manages a device-centered viewport with fixed radius (default 1000m).
 * Maps geographic area to pixel canvas (default 1000x1000px).
 * Handles gesture interactions and optional debug teleport feature.
 */
function MapCanvasViewport(props: MapCanvasViewportProps) {
  const { children, onLayout } = props
  const { styles } = useApp(useStyles)
  const { size, boundary, image } = useMapCanvas()
  const surfaceBoundary = useMapSurfaceBoundary()
  const { sensorApplication } = getAppContext()
  const actions = getMapCanvasActions()

  // Handle long press for dev teleport
  const handleLongPress = (x: number, y: number) => {
    if (!surfaceBoundary) return

    const geoPosition = mapUtils.positionToCoordinates({ x, y }, boundary, size)
    logger.log('📍 Teleport to:', geoPosition)
    sensorApplication.setDevice({ location: geoPosition, heading: 0 })
  }

  // Handle gesture end - sync to store
  const handleGestureEnd = (s: number, tx: number, ty: number) => {
    const currentScale = getMapState().canvas.scale
    actions.setCanvas({ scale: { ...currentScale, init: s }, offset: { x: tx, y: ty } })
  }

  const { scale: viewportScale } = useMapCanvas()  // Reactive hook for scale updates

  const { gesture, animatedStyles, scale, compensatedScale } = useViewportGestures({
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
    <MapScaleProvider value={{ scale, compensatedScale }}>
      <View style={styles?.container} onLayout={handleLayout} id='device-viewport-content'>
        {/* Static viewport background image */}
        {image && (
          <View style={styles?.backgroundContainer}>
            <Image
              source={{ uri: image }}
              width={size.width}
              height={size.height}
              style={styles?.backgroundImage}
              showLoader={false}
            />
          </View>
        )}

        <GestureHandlerRootView style={size}>
          <GestureDetector gesture={gesture}>
            <Animated.View style={[size, animatedStyles, { overflow: 'hidden' }]}>
              {children}
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>

        {config.debug.enableMapDebug && <MapCanvasDebug animatedStyles={animatedStyles} />}
      </View>
    </MapScaleProvider>
  )
}

const { canvas } = getMapThemeDefaults()
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
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    opacity: canvas.imageOpacity,
  },
}))

export { MapCanvasViewport }

