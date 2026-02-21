import { getSensorData } from '@app/features/sensor';
import { createTestContext } from '@test/testContext';

describe('when user is using discovery map', () => {
  const testContext = createTestContext()
  const { sensorApplication } = testContext.getAppContextStore();

  beforeAll(async () => {
    await testContext.createSession()
    await testContext.createSandbox()
  })

  test('should start a scan and receive a scan event', async () => {
    const trail = testContext.getDataSet().trails[0]

    sensorApplication.onScanEvent(scanEvent => {
      expect(getSensorData()?.latestScanId).toBe(scanEvent.id)
    })
    await sensorApplication.startScan(trail.id)

    expect(getSensorData().scanRecords.length).toBe(1)
  })
})
