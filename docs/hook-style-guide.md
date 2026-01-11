# React Hook Style Guide

## Based on useMapGestures Analysis

### 1. Hook Structure & Organization

#### ✅ Good Practice
```typescript
export const useMapGestures = (mapData: MapData, onGeoTap?: (location: GeoLocation) => void): GestureHandlers => {
  // 1. Extract props/config first
  const { scale: scaleConfig, mapSize, containerSize } = mapData
  const { current: initialScale, min: minScale, max: maxScale } = scaleConfig
  
  // 2. Shared values and state
  const scale = useSharedValue(initialScale)
  const [inverseScale, setInverseScale] = useState(1)
  
  // 3. Effects for synchronization
  useEffect(() => {
    // Sync logic
  }, [initialScale])
  
  // 4. Helper functions
  const calculateBounds = () => { /* ... */ }
  
  // 5. Event handlers
  const pan = Gesture.Pan()
  
  // 6. Return interface
  return { gesture, animatedStyles, scale: scale.value, inverseScale }
}
```

### 2. Parameter Design

#### ✅ Good: Single Configuration Object
```typescript
// Current approach - good for complex data
useMapGestures(mapData: MapData, onGeoTap?: (location: GeoLocation) => void)
```

#### ❌ Avoid: Too Many Parameters
```typescript
// Avoid this
useMapGestures(
  mapWidth: number,
  mapHeight: number,
  containerWidth: number,
  containerHeight: number,
  initialScale: number,
  minScale: number,
  maxScale: number,
  onGeoTap?: (location: GeoLocation) => void
)
```

### 3. State Management

#### ✅ Proper Shared Value Synchronization
```typescript
const scale = useSharedValue(initialScale)

// Always sync when deps change
useEffect(() => {
  if (scale.value !== initialScale) {
    scale.value = initialScale
    baseScale.value = initialScale
  }
}, [initialScale])
```

#### ❌ Avoid: Unsynchronized Shared Values
```typescript
// This causes bugs - shared value doesn't update automatically
const scale = useSharedValue(initialScale) // Only initial value, no sync
```

### 4. Function Organization

#### ✅ Group Related Functions
```typescript
// Calculation functions
const calculateBounds = () => { /* ... */ }
const applyBoundsWithBounce = () => { /* ... */ }

// Gesture handlers
const pan = Gesture.Pan()
const pinch = Gesture.Pinch()
const singleTap = Gesture.Tap()
```

#### ✅ Use Worklet Annotation
```typescript
const calculateBounds = () => {
  'worklet' // Essential for performance
  // ... calculations
}
```

### 5. Effects Best Practices

#### ✅ Specific Dependencies
```typescript
useEffect(() => {
  // Web-specific logic
}, [containerWidth, containerHeight]) // Specific deps

useEffect(() => {
  // Scale synchronization
}, [initialScale]) // Single responsibility
```

#### ❌ Avoid: Missing or Wrong Dependencies
```typescript
useEffect(() => {
  // Logic using containerWidth, containerHeight
}, []) // Missing dependencies - will cause stale closures
```

### 6. Performance Optimizations

#### ✅ Memoize Complex Calculations
```typescript
const springConfig = useMemo(() => ({
  damping: 10,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: false,
}), []) // Static config - memoize
```

#### ✅ Use Worklets for Reanimated
```typescript
const applyResistance = (value: number, max: number, shouldCenter: boolean) => {
  'worklet' // Runs on UI thread
  // ... logic
}
```

### 7. Type Safety

#### ✅ Strong Interface Definition
```typescript
interface GestureHandlers {
  gesture: any // TODO: Could be more specific
  animatedStyles: any // TODO: Could be more specific  
  scale: number
  inverseScale: number
}
```

#### ✅ Proper Parameter Types
```typescript
const useMapGestures = (
  mapData: MapData, 
  onGeoTap?: (location: GeoLocation) => void
): GestureHandlers
```

### 8. Debugging & Development

#### ✅ Conditional Debugging
```typescript
const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development'

if (isDevelopment) {
  console.log('Debug info:', { scale: scale.value })
}
```

#### ✅ Comment Complex Logic
```typescript
// When map is larger than container, calculate bounds to keep minimum portion visible
const minVisiblePortion = 0.4 // At least 40% of the container must show map content
```

### 9. Error Handling

#### ✅ Defensive Programming
```typescript
const element = document.getElementById('map-content')
element?.addEventListener('wheel', handleWheel) // Safe chaining
```

#### ✅ Cleanup Effects
```typescript
useEffect(() => {
  const handleWheel = (event: WheelEvent) => { /* ... */ }
  
  element?.addEventListener('wheel', handleWheel)
  return () => element?.removeEventListener('wheel', handleWheel) // Cleanup
}, [dependencies])
```

### 10. Code Organization Principles

#### ✅ Single Responsibility
```typescript
// Each function has one clear purpose
const calculateBounds = () => { /* Only bounds calculation */ }
const applyBoundsWithBounce = () => { /* Only bounds application */ }
```

#### ✅ Consistent Naming
```typescript
// Consistent prefixes/patterns
const scale = useSharedValue(initialScale)
const baseScale = useSharedValue(initialScale)
const translationX = useSharedValue(0)
const translationY = useSharedValue(0)
```

### 11. Improvements for useMapGestures

#### 🔄 Current Issues to Address

1. **Type Safety**
```typescript
// More specific types instead of 'any'
interface GestureHandlers {
  gesture: ComposedGesture
  animatedStyles: SharedValue<StyleProp<ViewStyle>>
  scale: number
  inverseScale: number
}
```

2. **Configuration Extraction**
```typescript
// Move magic numbers to constants
const GESTURE_CONFIG = {
  MIN_VISIBLE_PORTION: 0.4,
  RESISTANCE_FACTOR: 0.5,
  CENTER_RESISTANCE: 0.3,
} as const
```

3. **Debug Logic Separation**
```typescript
// Separate debug/development logic
if (__DEV__) {
  // All debug console.logs
}
```

4. **Better Dependency Management**
```typescript
// Use callback to avoid recreating functions
const handleWheel = useCallback((event: WheelEvent) => {
  // ... wheel logic
}, [scale, minScale, maxScale])
```

### 12. Testing Considerations

#### ✅ Testable Structure
- Pure functions (`calculateBounds`) are easily testable
- Configuration objects can be mocked
- Side effects are isolated in useEffect

#### ✅ Mock-Friendly Design
- External dependencies (Platform.OS) can be mocked
- Gesture library can be mocked for unit tests

## Summary

The `useMapGestures` hook demonstrates many good practices but could benefit from:
- Better type safety
- Configuration extraction
- Debug code separation
- Performance optimizations with useMemo/useCallback
- More explicit error boundaries

This hook is a good example of managing complex state with multiple responsibilities while maintaining reasonable organization.
