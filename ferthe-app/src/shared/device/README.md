# Device Storage Connectors

This module provides different storage connector implementations for the app.

## Available Connectors

### SecureStoreConnector (Production)
Uses Expo SecureStore for secure, persistent storage on device.

```typescript
import { secureStoreConnector } from '@app/shared/device'

// Store sensitive data securely
await secureStoreConnector.write('authSession', sessionData)
const session = await secureStoreConnector.read('authSession')
```

### MemoryStoreConnector (Testing)
Uses in-memory storage that persists only during app session. Useful for testing and development.

```typescript
import { memoryStoreConnector } from '@app/shared/device'

// Store data in memory (lost on app restart)
await memoryStoreConnector.write('testData', { test: true })
const data = await memoryStoreConnector.read('testData')

// Additional testing methods
memoryStoreConnector.clear() // Clear all data
memoryStoreConnector.size() // Get number of items
memoryStoreConnector.getAllKeys() // Get all stored keys
```

## Factory Pattern

Use the factory to switch between storage types:

```typescript
import { createStoreConnector, getStoreConnector } from '@app/shared/device'

// Create specific type
const memoryStore = createStoreConnector({ type: 'memory' })
const secureStore = createStoreConnector({ type: 'secure' })

// Get store based on environment
const store = getStoreConnector() // Auto-selects based on env
```

## Environment Configuration

Set environment variable to use memory store in development:

```bash
EXPO_PUBLIC_USE_MEMORY_STORE=true
```

## Testing

Import test utilities:

```typescript
import { 
  testMemoryStoreConnector, 
  testJsonStoreConnector, 
  testAllStoreTypes,
  testStoreFactory 
} from '@app/dev/testMemoryStore'

// Run tests
await testMemoryStoreConnector()
await testJsonStoreConnector()
await testAllStoreTypes()
await testStoreFactory()
```

// Run tests
await testMemoryStoreConnector()
await testStoreFactory()
```

Use the test component for visual testing:

```typescript
import { StoreTestComponent } from '@app/dev/components/StoreTestComponent'

// Add to your dev screen
<StoreTestComponent />
```
