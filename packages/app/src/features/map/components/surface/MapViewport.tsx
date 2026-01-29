import { getAppContext } from '@app/appContext'
import { ENV } from '@app/env.ts'
import { logger } from '@app/shared/utils/logger'
import { GeoLocation } from '@shared/geo'
import { ReactNode } from 'react'
import { View } from 'react-native'
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { useViewportGestures } from '../../hooks/useViewportGestures'
import { getViewportActions, useMapSurfaceBoundary, useMapViewport } from '../../stores/mapStore'
import { mapUtils } from '../../utils/geoToScreenTransform.'
import { MapViewportDebug } from './MapViewportDebug'

interface DeviceViewportWrapperProps {
  deviceLocation: GeoLocation
  radiusMeters?: number
  viewportSize?: { width: number; height: number }
  children: ReactNode
  onLayout?: (size: { width: number; height: number }) => void
  debug?: boolean
}

/**
 * DeviceViewportWrapper
 * 
 * Manages a device-centered viewport with fixed radius (default 1000m)
 * Maps geographic area to pixel canvas (default 1000x1000px)
 * 
 * Independent component - does not know about Map specifics
 */
export function MapViewport({
  children,
  onLayout,
  debug = ENV.isDevelopment,
}: DeviceViewportWrapperProps) {
  const { size, boundary } = useMapViewport()
  const surfaceBoundary = useMapSurfaceBoundary()
  const { sensorApplication } = getAppContext()
  const actions = getViewportActions()

  // Handle long press for dev teleport
  const handleLongPress = (x: number, y: number) => {
    if (!surfaceBoundary) return

    // Convert viewport position to geo coordinates
    const geoPosition = mapUtils.positionToCoordinates({ x, y }, boundary, size)

    logger.log('📍 Teleport to:', geoPosition)
    sensorApplication.setDevice({ location: geoPosition, heading: 0 })
  }

  // Handle gesture end - sync to store
  const handleGestureEnd = (s: number, tx: number, ty: number) => {
    logger.log('MapViewport Gesture End - Sync to Store')
    actions.setViewportTransform(s, { x: tx, y: ty })
  }

  // Setup gesture handlers
  const { gesture, animatedStyles, scale, translationX, translationY } = useViewportGestures({
    width: size.width,
    height: size.height,
    elementId: 'device-viewport-content',
    snapToCenter: true,
    onLongPress: debug ? handleLongPress : undefined,
    onGestureEnd: handleGestureEnd,
  })

  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout
    onLayout?.({ width, height })
  }

  return (
    <View style={{ flex: 1, position: 'absolute', height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center' }} onLayout={handleLayout} id='device-viewport-content'>
      <GestureHandlerRootView style={{ ...size }}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[{ ...size, }, animatedStyles]}>
            {children}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>

      {debug && <MapViewportDebug />}
    </View>
  )
}

