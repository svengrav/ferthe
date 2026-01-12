import { createTestContext } from '@test/testContext'

describe('Trail', () => {
  const testContext = createTestContext()
  const { trailApplication: coreTrailApplication } = testContext.getCoreContext()

  beforeAll(async () => {
    await testContext.createSession()
    await testContext.createSandbox()
  })

  test('lists all trails', async () => {
    // Arrange

    const session = testContext.getSession()
    const trails = await coreTrailApplication.listTrails(session)
    const trail = await coreTrailApplication.getTrail(session, trails.data![0].id)
    expect(trails.success).toBe(true)
    expect(trails.data!.length).toBeGreaterThan(0)

    expect(trail.success).toBe(true)
    expect(trail.data).toBeDefined()
  })
})
