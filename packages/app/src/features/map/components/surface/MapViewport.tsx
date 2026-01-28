import { ENV } from '@app/env.ts'
import { GeoLocation } from '@shared/geo'
import { ReactNode, useEffect, useMemo } from 'react'
import { View } from 'react-native'
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useAnimatedReaction } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useViewportGestures } from '../../hooks/useViewportGestures'
import { getViewportActions } from '../../stores/viewportStore'
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

const DEFAULT_RADIUS = 1000 // meters
const DEFAULT_VIEWPORT_SIZE = { width: 1000, height: 1000 } // pixels

/**
 * DeviceViewportWrapper
 * 
 * Manages a device-centered viewport with fixed radius (default 1000m)
 * Maps geographic area to pixel canvas (default 1000x1000px)
 * 
 * Independent component - does not know about Map specifics
 */
export function MapViewport({
  deviceLocation,
  radiusMeters = DEFAULT_RADIUS,
  viewportSize = DEFAULT_VIEWPORT_SIZE,
  children,
  onLayout,
  debug = ENV.isDevelopment,
}: DeviceViewportWrapperProps) {

  // Calculate geographic boundary for the viewport (memoized)
  const boundary = useMemo(
    () => mapUtils.calculateDeviceViewportBoundary(deviceLocation, radiusMeters),
    [deviceLocation.lat, deviceLocation.lon, radiusMeters]
  )

  // Setup gesture handlers
  const { gesture, animatedStyles, scale, translationX, translationY } = useViewportGestures({
    width: viewportSize.width,
    height: viewportSize.height,
    elementId: 'device-viewport-content',
    snapToCenter: true,
  })

  // Initialize store with SharedValue references and context data
  useEffect(() => {
    const actions = getViewportActions()
    actions.setSharedValues(scale, translationX, translationY)
  }, [scale, translationX, translationY])

  // Update viewport dimensions and context when props change
  useEffect(() => {
    const actions = getViewportActions()
    actions.setViewportDimensions(viewportSize.width, viewportSize.height)
    actions.setViewportContext(deviceLocation, radiusMeters, boundary)
  }, [
    viewportSize.width,
    viewportSize.height,
    deviceLocation.lat,
    deviceLocation.lon,
    radiusMeters,
    boundary.northEast.lat,
    boundary.northEast.lon,
    boundary.southWest.lat,
    boundary.southWest.lon,
  ])

  // Sync primitive values to store (JS-Thread accessible)
  const syncToStore = (s: number, tx: number, ty: number) => {
    const actions = getViewportActions()
    actions.setViewportValues(s, tx, ty)
  }

  useAnimatedReaction(
    () => ({ scale: scale.value, tx: translationX.value, ty: translationY.value }),
    (current) => scheduleOnRN(() => { syncToStore(current.scale, current.tx, current.ty) })
  )

  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout
    onLayout?.({ width, height })
  }

  return (
    <View style={{ flex: 1, position: 'absolute', height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center' }} onLayout={handleLayout} id='device-viewport-content'>
      <GestureHandlerRootView style={{ ...viewportSize }}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[{ ...viewportSize, }, animatedStyles]}>
            {children}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>

      {debug && <MapViewportDebug />}
    </View>
  )
}

export { DEFAULT_RADIUS, DEFAULT_VIEWPORT_SIZE }

