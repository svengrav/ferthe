# Zustand Usage Guide

## Table of Contents

1. Introduction
2. Basic Store Creation
3. Store Access Patterns
4. Performance Optimization
5. Event System Integration
6. Advanced Patterns
7. Best Practices

## Introduction

Zustand is a minimalist state management library for React that uses hooks. It combines the simplicity of React's useState with the power of Redux-like state management.

Key advantages:

- Small bundle size (~1KB)
- No boilerplate
- TypeScript friendly
- No context providers needed
- Can be used outside React components

## Basic Store Creation

```typescript
import { create } from 'zustand'

interface UserStore {
  userId: string | null
  username: string
  setUser: (id: string, userData: UserData) => void
  resetUser: () => void
}

export const useUserStore = create<UserStore>(set => ({
  userId: null,
  username: '',
  setUser: (id, userData) => set({ userId: id, username: userData.username }),
  resetUser: () => set({ userId: null, username: '' }),
}))
```

## Store Access Patterns

### Direct Access (Not Recommended for Large Stores)

```typescript
// Subscribes to ALL state changes
const { userId, username, setUser } = useUserStore()
```

### Selector Pattern (Recommended)

```typescript
// Only re-renders when userId changes
const userId = useUserStore(state => state.userId)

// Only re-renders when setUser changes
const setUser = useUserStore(state => state.setUser)
```

### Multiple Properties with Single Selector

```typescript
// Only re-renders when either userId or username changes
const { userId, username } = useUserStore(state => ({ userId: state.userId, username: state.username }))
```

### Object Shorthand Syntax

```typescript
// Equivalent to the above, with cleaner syntax
const { userId, username } = useUserStore(({ userId, username }) => ({ userId, username }))
```

## Performance Optimization

### Component Re-render Behavior

- Components using direct store access re-render on ANY state change
- Components using selectors re-render ONLY when selected values change
- Zustand performs shallow equality checks on returned objects

```typescript
// This will cause re-renders only when discoveries changes
const discoveries = useDiscoveryStore(state => state.discoveries)

// Update that triggers re-render in components watching discoveries
useDiscoveryStore.setState({ discoveries: [...discoveries, newDiscovery] })

// Update that won't trigger re-render in components only watching discoveries
useDiscoveryStore.setState({ mode: 'trail' })
```

### Creating Derived Selectors

```typescript
// Derived data selectors
const activeDiscoveries = useDiscoveryStore(state => state.discoveries.filter(d => d.active))

// Combined data from multiple stores
const userWithPermissions = useUserStore(state => ({
  userId: state.userId,
  permissions: usePermissionStore.getState().permissions[state.userId] || [],
}))
```

## Event System Integration

```typescript
// Event-based store
export const useSensorStore = create<SensorStore>((set, get) => ({
  device: { location: { lat: 0, lon: 0 }, heading: 0 },
  latestScan: null,

  // State updates
  setDevice: device => {
    set({ device })
    events.emit('deviceUpdated', device)
  },

  // Event subscriptions
  onDeviceUpdated: callback => {
    events.on('deviceUpdated', callback)
    return () => events.off('deviceUpdated', callback)
  },
}))

// Hook to subscribe to store events
function useEvent<T>(subscribeFunction, callback, dependencies = []) {
  const memoizedCallback = useCallback(callback, dependencies)

  useEffect(() => {
    const unsubscribe = subscribeFunction(memoizedCallback)
    return unsubscribe
  }, [subscribeFunction, memoizedCallback])
}

// Usage example
useEvent(useSensorStore.getState().onDeviceUpdated, device => console.log('Device updated:', device), [])
```

## Advanced Patterns

### Creating Store Hooks

```typescript
// Enhanced store hook with built-in selectors
export const useActiveTrail = () =>
  useDiscoveryStore(state => ({
    trail: state.trail,
    setTrail: state.setTrail,
  }))

// Usage
const { trail, setTrail } = useActiveTrail()
```

### Combining Multiple Stores in Application Hooks

```typescript
function useDiscoveryApplication() {
  const { trail, setTrail } = useDiscoveryStore(({ trail, setTrail }) => ({ trail, setTrail }))

  const { spots, setSpots } = useTrailStore(({ spots, setSpots }) => ({ spots, setSpots }))

  // Application logic that combines both stores
  const fetchTrailData = async trailId => {
    const data = await api.getTrailData(trailId)
    setTrail(data.trail)
    setSpots(data.spots)
  }

  return {
    trail,
    spots,
    fetchTrailData,
  }
}
```

## Best Practices

1. **Use selectors for performance**

   - Always use selectors to subscribe only to needed state

2. **Separate state access from state updates**

   - Consider separating read-only access from state mutations

3. **Organize stores by domain**

   - Create distinct stores for different concerns (user, discovery, sensor)

4. **Prefer calculated values over duplicated state**

   - Derive values from existing state rather than duplicating

5. **Centralize complex state transitions**

   - Use application hooks for complex logic spanning multiple stores

6. **Handle async operations with proper error handling**

   ```typescript
   const fetchData = async () => {
     try {
       set({ status: 'loading' })
       const data = await api.fetch()
       set({ data, status: 'success' })
     } catch (error) {
       set({ error, status: 'error' })
       console.error('Failed to fetch data:', error)
     }
   }
   ```

7. **Avoid storing derived state**

   - Compute derived values in selectors instead of storing them

8. **Use TypeScript for better developer experience**
   - Define clear interfaces for your stores to ensure type safety
