# Map Architecture Documentation

## Overview

The map system is designed to display interactive maps with gesture controls (pan, pinch, tap) while maintaining proper coordinate transformations between geographical locations and screen positions.

## Core Concepts & Definitions

### Map Surface
- **Definition**: The actual map image with fixed dimensions (typically 1000x1000 pixels)
- **Purpose**: Represents the geographical area with a specific boundary
- **Properties**: 
  - Fixed dimensions independent of screen size
  - Contains geographical coordinate system
  - Source of truth for all coordinate calculations

### Container (ViewBox)
- **Definition**: The visible area on the user's device screen that displays the map
- **Purpose**: Defines the viewport through which users see and interact with the map
- **Properties**:
  - Variable dimensions based on device screen size
  - Acts as a "window" into the map surface
  - Determines the visible portion of the map

### Scale System
- **Definition**: Controls zoom level and size relationship between map surface and container
- **Components**:
  - `current`: Active scale factor (1.0 = original size)
  - `min`: Minimum allowed zoom out (e.g., 0.5 = 50% of original)
  - `max`: Maximum allowed zoom in (e.g., 2.0 = 200% of original)
- **Calculation**: Dynamically computed based on optimal fit between map and container

### Transformation Matrix
- **Translation**: Pan offset (translateX, translateY) in pixels
- **Scale**: Zoom factor applied to map surface
- **Purpose**: Converts between coordinate systems and handles user interactions

## Architecture Flow

```
Geographic Coordinates (lat, lon)
           ↓
Map Surface Coordinates (0-1000, 0-1000)
           ↓
Screen Coordinates (container space)
           ↓
User Interaction (gestures)
```

## Key Components

### 1. MapData Interface
```typescript
interface MapData {
  mapSize: { width: number, height: number }      // Map surface dimensions (1000x1000)
  containerSize: { width: number, height: number } // ViewBox dimensions (screen size)
  scale: { current: number, min: number, max: number }
  boundary: GeoBoundary                           // Geographic bounds
  // ... other properties
}
```

### 2. Scale Calculation (`mapService.calculateOptimalScale`)
- **Input**: Map surface dimensions + container dimensions
- **Logic**: 
  ```typescript
  const scaleToFit = Math.min(
    containerSize.width / mapSize.width,
    containerSize.height / mapSize.height
  )
  
  return {
    current: scaleToFit,
    min: scaleToFit * 0.5,    // Allow zoom out to 50%
    max: scaleToFit * 4.0     // Allow zoom in to 400%
  }
  ```
- **Output**: Optimal scale configuration based on screen size

### 3. Gesture System (`useMapGestures`)
- **Pan Gesture**: Translates map position within bounds
- **Pinch Gesture**: Scales map with resistance at limits
- **Tap Gesture**: Converts screen coordinates to geographic coordinates
- **Bounds Enforcement**: Prevents map from being panned completely out of view

### 4. Coordinate Transformation (`geoToScreenTransform`)
- **Geographic → Map Surface**: Uses boundary and map dimensions
- **Map Surface → Screen**: Applies scale and translation
- **Screen → Geographic**: Reverses the transformation chain

## Data Flow

### 1. Initialization (MapApplication)
```
Screen Size Input
      ↓
Calculate Optimal Scale
      ↓
Create MapData with:
- mapSize: 1000x1000 (fixed)
- containerSize: screenSize (dynamic)
- scale: calculated values
```

### 2. Rendering (Map Component)
```
MapData
      ↓
MapSurface: Uses mapSize for image dimensions
      ↓
Container: Uses containerSize for viewport
      ↓
GestureHandler: Applies transformations
```

### 3. User Interaction
```
Gesture Input
      ↓
Calculate New Translation/Scale
      ↓
Apply Bounds Constraints
      ↓
Update Transform Matrix
      ↓
Re-render with new position
```

## Bounds Logic

### Purpose
Prevent users from panning the map completely out of the visible area, especially at high zoom levels.

### Implementation
```typescript
const minVisiblePortion = 0.4 // 40% of container must show map content

const maxTranslateX = scaledWidth > containerWidth 
  ? (scaledWidth - containerWidth * minVisiblePortion) / 2 
  : 0
```

### Behavior
- **Low zoom**: Map smaller than container → center it
- **High zoom**: Map larger than container → allow panning but keep 40% visible

## File Structure

```
src/features/map/
├── components/
│   ├── Map.tsx                    # Main map component
│   └── surface/
│       ├── MapSurface.tsx         # Map image rendering
│       └── ...                    # Other map overlays
├── hooks/
│   └── useMapGestures.ts          # Gesture handling logic
├── types/
│   └── map.ts                     # Type definitions and defaults
├── utils/
│   ├── mapService.ts              # Scale calculation and utilities
│   └── geoToScreenTransform.ts    # Coordinate transformations
└── mapApplication.ts              # Main application logic
```

## Key Principles

### Separation of Concerns
- **mapSize**: Fixed map surface dimensions for calculations
- **containerSize**: Dynamic viewport dimensions for layout
- **scale**: Computed relationship between the two

### Coordinate System Consistency
- All transformations follow the same coordinate chain
- Geographic → Map Surface → Screen coordinates
- Consistent scaling and translation application

### Performance Optimization
- Memoized components to prevent unnecessary re-renders
- Efficient gesture calculations using Reanimated worklets
- Proper bounds checking to limit computation

### User Experience
- Smooth gesture interactions with spring animations
- Resistance at scale and pan boundaries
- Intuitive tap-to-coordinate conversion

## Configuration

### Default Values
```typescript
MAP_SPECIFICATION_DEFAULTS = {
  MAP_WIDTH: 1000,           // Fixed map surface width
  MAP_HEIGHT: 1000,          // Fixed map surface height
  MAP_CONTAINER_WIDTH: 600,  // Default container width
  MAP_CONTAINER_HEIGHT: 600, // Default container height
  MAP_SCALE: {
    current: 1,
    min: 0.5,
    max: 4,
  }
}
```

### Dynamic Calculation
The actual scale values are computed at runtime based on the relationship between map surface size and actual container size, ensuring optimal display on any device.
