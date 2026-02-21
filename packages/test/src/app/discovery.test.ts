import { createTestContext } from '@test/testContext'
import { waitForEvent } from '@test/utils/eventTestUtils'

describe('Discovery Events', () => {
  const testContext = createTestContext()
  const { discoveryApplication, sensorApplication } = testContext.getAppContextStore()

  beforeAll(async () => {
    await testContext.createSession()
    await testContext.createSandbox()
  })

  test('should receive discovery events when location changes', async () => {
    // Arrange
    await discoveryApplication.requestDiscoveryState()

    const discoveryPromise = waitForEvent(discoveryApplication.onNewDiscoveries, 'newDiscoveries')

    // Act - trigger the event
    sensorApplication.setDevice({ location: { lat: 51.794, lon: 7.619 }, heading: 90 })

    // Wait for the event and assert
    const discoveries = await discoveryPromise
    expect(discoveries.length).toBeGreaterThan(0)
  })

  test('should handle discoveryTrailUpdated events', async () => {
    // Arrange
    const trail = testContext.getDataSet().trails[0]
    await discoveryApplication.requestDiscoveryState()

    const trailUpdatePromise = waitForEvent(discoveryApplication.onDiscoveryTrailUpdate, 'discoveryTrailUpdated')

    // Act
    discoveryApplication.setActiveTrail(trail.id)

    // Assert
    const trailState = await trailUpdatePromise
    expect(trailState.trail).toBeDefined()
  })
})
