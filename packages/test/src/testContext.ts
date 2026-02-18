import { createAppContext } from '@app/appContext'
import { getMemoryStoreConnector } from '@app/shared/device/memoryStoreConnector'
import { createCoreContext, getCoreStoreIdentifiers } from '@core/core'
import { createMemoryStore } from '@core/index'
import { AccountSession, Discovery, Spot, Trail } from '@shared/contracts'
import { getSandboxData } from './sandbox/data'

interface TestContextState {
  session: AccountSession | undefined
  dataSet: {
    trails: Trail[]
    spots: Spot[]
    discoveries: Discovery[]
  }
}

export const createTestContext = () => {
  // Configure the application context for testing
  const sandboxData = getSandboxData()
  const memoryStoreConnector = createMemoryStore()
  const storeIds = getCoreStoreIdentifiers()
  const testState: TestContextState = {
    session: undefined,
    dataSet: {
      trails: [],
      spots: [],
      discoveries: [],
    },
  }

  const coreContext = createCoreContext({
    environment: 'test',
    connectors: {
      storeConnector: memoryStoreConnector,
    },
  })

  const appContext = createAppContext({
    environment: 'test',
    connectors: {
      secureStoreConnector: getMemoryStoreConnector(),
    },
    apiContext: coreContext,
  })

  const loadData = async () => {
    console.log('Loading sandbox data into memory store...')

    const session = testState.session
    if (!session) {
      throw new Error('Session not created. Call createSession() first.')
    }
    sandboxData.trails.data.forEach(async trail => {
      await coreContext.trailApplication.createTrail(session, trail)
    })

    sandboxData.spots.data.forEach(async spot => {
      await coreContext.spotApplication.createSpot(session, spot)
    })

    sandboxData.discoveries.data.forEach(async discovery => {
      await memoryStoreConnector.create(storeIds.DISCOVERIES, discovery)
    })

    testState.dataSet.trails = await memoryStoreConnector.list(storeIds.TRAILS)
    testState.dataSet.spots = await memoryStoreConnector.list(storeIds.TRAIL_SPOTS)
    testState.dataSet.discoveries = await memoryStoreConnector.list(storeIds.DISCOVERIES)
  }

  const createSession = async () => {
    testState.session = (await coreContext.accountApplication.createLocalAccount()).data

    // Sync the session with the app context's account application
    if (testState.session) {
      // Import account store actions to set the session in the app context
      const { getAccountActions } = await import('@app/features/account/stores/accountStore')
      const accountActions = getAccountActions()
      accountActions.setSession(testState.session)
      accountActions.setAccountType(testState.session.accountType)
      accountActions.setIsAuthenticated(true)
    }

    return testState.session
  }

  return {
    getDataSet: () => testState.dataSet,
    createSession: async () => await createSession(),
    getSession: () => {
      if (!testState.session) {
        throw new Error('Session not created. Call createSession() first.')
      }
      return testState.session
    },
    getAppContext: () => appContext,
    getCoreContext: () => coreContext,
    createSandbox: async () => await loadData(),
  }
}
