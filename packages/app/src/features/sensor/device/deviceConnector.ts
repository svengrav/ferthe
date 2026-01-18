import { logger } from '@app/shared/utils/logger'
import { createEventSystem } from '@shared/events/eventHandler'
import * as Location from 'expo-location'
import { hasSignificantLocationChange } from './deviceUtils'
import { DeviceConnector, DeviceLocation } from './types'

type DeviceLocationEvents = {
  locationUpdated: DeviceLocation
}

// Validate if coordinates are valid
const isValidCoordinate = (lat: number, lon: number): boolean => !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0 && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180

// Create a factory function that creates a new device connector instance
export const createDeviceConnector = (): DeviceConnector => {
  const locationEventStore = createEventSystem<DeviceLocationEvents>()
  let locationSubscription: Location.LocationSubscription | null = null
  let headingSubscription: Location.LocationSubscription | null = null
  let healthCheckInterval: NodeJS.Timeout | null = null

  // Keep track of the last emitted update
  let lastDeviceUpdate: DeviceLocation = {
    location: { lat: 0, lon: 0 },
    heading: 0,
  }

  // Smoothing state for heading (EMA - Exponential Moving Average)
  let smoothedHeading: number | null = null
  const SMOOTHING_FACTOR = 0.3 // α: 30% new value, 70% previous value

  // Event emitter function to notify subscribers of location updates
  const emitUpdate = (update: DeviceLocation) => {
    // Create a new object to avoid reference issues
    const newUpdate = { ...update }
    locationEventStore.emit('locationUpdated', newUpdate)

    // Update the last device update
    lastDeviceUpdate = newUpdate
  }

  // Check if update is significant before emitting
  const emitIfSignificant = (newUpdate: DeviceLocation) => {
    if (hasSignificantLocationChange(lastDeviceUpdate, newUpdate)) {
      emitUpdate(newUpdate)
    }
  }

  // Request location permission from the user
  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      logger.error('Location permission not granted')
      return
    } else {
      logger.log('Location permission granted')
    }
  }

  const initializeLocationTracking = async () => {
    try {
      // Clean up existing subscriptions
      if (locationSubscription) {
        locationSubscription.remove()
        locationSubscription = null
      }
      if (headingSubscription) {
        headingSubscription.remove()
        headingSubscription = null
      }

      // Get initial position with validation
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const { latitude, longitude } = position.coords

      if (!isValidCoordinate(latitude, longitude)) {
        logger.error('Invalid initial coordinates:', latitude, longitude)
        return
      }

      const initialDevice = {
        heading: 0,
        location: {
          lat: latitude,
          lon: longitude,
        },
      }
      lastDeviceUpdate = { ...initialDevice }
      emitUpdate(initialDevice)

      // Watch Location with error handling
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5,
        },
        newLocation => {
          try {
            const { latitude, longitude } = newLocation.coords

            if (!isValidCoordinate(latitude, longitude)) {
              logger.warn('Invalid coordinates received:', latitude, longitude)
              return
            }

            const updatedDevice = {
              ...lastDeviceUpdate, // Keep previous heading
              location: {
                lat: latitude,
                lon: longitude,
              },
            }
            emitIfSignificant(updatedDevice)
          } catch (error) {
            logger.error('Location update error:', error)
          }
        }
      )

      // Watch Heading with error handling
      headingSubscription = await Location.watchHeadingAsync(headingData => {
        try {
          const rawHeading = headingData.magHeading ?? headingData.trueHeading ?? 0

          // Apply Exponential Moving Average for smooth transitions
          if (smoothedHeading === null) {
            smoothedHeading = rawHeading
          } else {
            // Handle circular nature of degrees (0° = 360°)
            let delta = rawHeading - smoothedHeading
            if (delta > 180) delta -= 360
            if (delta < -180) delta += 360

            smoothedHeading = (smoothedHeading + SMOOTHING_FACTOR * delta + 360) % 360
          }

          // Round to 10° increments for less jitter
          const roundedHeading = Math.round(smoothedHeading / 10) * 10

          // Only update if heading changed significantly (10° threshold)
          if (Math.abs(roundedHeading - lastDeviceUpdate.heading) >= 10) {
            const updatedDevice = {
              ...lastDeviceUpdate, // Keep the current location
              heading: roundedHeading,
            }
            emitIfSignificant(updatedDevice)
          }
        } catch (error) {
          logger.error('Heading update error:', error)
        }
      })

      // Start health check to monitor subscriptions
      startHealthCheck()
    } catch (error) {
      logger.error('Failed to initialize location tracking:', error)
    }
  }

  const startHealthCheck = () => {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval)
    }

    healthCheckInterval = setInterval(() => {
      if (!locationSubscription || !headingSubscription) {
        logger.warn('Location subscriptions lost, attempting to reinitialize...')
        initializeLocationTracking()
      }
    }, 30000) // Check every 30 seconds
  }

  const cleanup = () => {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval)
      healthCheckInterval = null
    }

    if (locationSubscription) {
      locationSubscription.remove()
      locationSubscription = null
    }

    if (headingSubscription) {
      headingSubscription.remove()
      headingSubscription = null
    }
  }

  return {
    onDeviceUpdated: (cb: (e: DeviceLocation) => void) => locationEventStore.on('locationUpdated', cb),
    offDeviceUpdated: (cb: (e: DeviceLocation) => void) => locationEventStore.off('locationUpdated', cb),
    requestLocationPermission,
    initializeLocationTracking,
    cleanup,
  }
}

// Create and export default instance
const deviceConnector: DeviceConnector = createDeviceConnector()
export const getDeviceConnector = (): DeviceConnector => deviceConnector
