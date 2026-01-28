import { ENV } from '@app/env.ts'
import { GeoLocation } from '@shared/geo'
import { ReactNode } from 'react'
import { View } from 'react-native'
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { useViewportGestures } from '../hooks/useViewportGestures'
import { mapUtils } from '../utils/geoToScreenTransform.'
import { MapViewportDebug } from './MapViewportDebug.tsx'

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

  // Calculate geographic boundary for the viewport
  const boundary = mapUtils.calculateDeviceViewportBoundary(deviceLocation, radiusMeters)

  // Setup gesture handlers
  const { gesture, animatedStyles, scale, translationX, translationY } = useViewportGestures({
    width: viewportSize.width,
    height: viewportSize.height,
    elementId: 'device-viewport-content',
    snapToCenter: true,
  })

  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout
    onLayout?.({ width, height })
  }

  return (
    <View style={{ flex: 1, height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'green' }} onLayout={handleLayout} id='device-viewport-content'>
      <GestureHandlerRootView style={{ ...viewportSize }}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[{ ...viewportSize, }, animatedStyles]}>
            {children}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>

      {debug && (
        <MapViewportDebug
          boundary={boundary}
          deviceLocation={deviceLocation}
          viewportSize={viewportSize}
          radiusMeters={radiusMeters}
          scale={scale}
          translationX={translationX}
          translationY={translationY}
        />
      )}
    </View>
  )
}

export { DEFAULT_RADIUS, DEFAULT_VIEWPORT_SIZE }

