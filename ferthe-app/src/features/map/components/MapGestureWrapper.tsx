import { ReactNode } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'

interface MapGestureWrapperProps {
  gesture: any
  children: ReactNode
  onLayout?: (event: LayoutChangeEvent) => void
}

export function MapGestureWrapper({ gesture, children, onLayout }: MapGestureWrapperProps) {
  // if (Platform.OS === 'web') {
  //   return <View>{children}</View>
  // }
  return (
    <GestureHandlerRootView id='map-gesture-root' style={{ flex: 1, height: '100%' }}>
      <GestureDetector gesture={gesture}>

      </GestureDetector>
    </GestureHandlerRootView>
  )
}
