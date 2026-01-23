import { logger } from '@app/shared/utils/logger'
import { AccountContext, Result, TrailApplicationContract } from '@shared/contracts'
import { getTrailStoreActions } from './stores/trailStore'

export interface TrailApplication {
  requestTrailState: () => Promise<void>
  requestTrailSpotPreviews: (trailId: string) => Promise<void>
}

interface TrailApplicationOptions {
  getAccountContext: () => Promise<Result<AccountContext>>
  trailAPI: TrailApplicationContract
}

export function createTrailApplication(options: TrailApplicationOptions) {
  const { trailAPI, getAccountContext } = options

  const getSession = async (): Promise<Result<AccountContext>> => {
    const accountSession = await getAccountContext()
    if (!accountSession.data) return { success: false, data: undefined }
    return { success: true, data: accountSession.data }
  }

  if (!trailAPI) throw new Error('Trail application dependency is required')

  const { listTrails } = trailAPI
  const { setStatus, setTrails } = getTrailStoreActions()

  const requestTrailState = async () => {
    const accountSession = await getSession()
    if (!accountSession.data) throw new Error('Account session not found!')

    setStatus('loading')
    const trails = await listTrails(accountSession.data)
    if (!trails.data || !trails.success) {
      logger.error('Failed to fetch trails:', trails.error)
      setStatus('error')
    } else {
      setTrails(trails.data)
      setStatus('ready')
    }
  }

  const requestTrailSpotPreviews = async (trailId: string) => {
    const accountSession = await getSession()
    if (!accountSession.data) throw new Error('Account session not found!')

    setStatus('loading')
    const spots = await trailAPI.listSpotPreviews(accountSession.data, trailId)
    if (!spots.data || !spots.success) {
      logger.error('Failed to fetch spots:', spots.error)
      setStatus('error')
    } else {
      // Assuming there's a method to set spots in the store
      getTrailStoreActions().setSpots(spots.data)
      setStatus('ready')
    }
  }

  return {
    requestTrailState,
    requestTrailSpotPreviews,
  }
}
