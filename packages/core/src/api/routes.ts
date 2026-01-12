import { createAsyncRequestHandler } from '@core/api/fastify/requestHandler'

import {
  Account,
  Clue,
  Discovery,
  DiscoveryLocationRecord,
  DiscoveryProfile,
  DiscoveryTrail,
  FirebaseConfig,
  SMSVerificationResult,
  ScanEvent,
  Spot,
  SpotPreview,
  Trail,
} from '@shared/contracts'
import { ApplicationContract, SMSCodeRequest } from '@shared/contracts/'
import { Route } from './fastify/types'

const createRoutes = (ctx: ApplicationContract): Route[] => {
  const { discoveryApplication, sensorApplication, trailApplication, accountApplication } = ctx

  // Create the request handler with account application access
  const asyncRequestHandler = createAsyncRequestHandler(accountApplication)

  return [
    {
      method: 'GET',
      version: 'v1',
      url: '/health',
      config: { isPublic: true },
      handler: asyncRequestHandler(async () => {
        return {
          success: true,
          status: 'ok',
          message: 'Ferthe Core API is running',
        }
      }),
    },

    // Discovery API Routes (Authenticated)
    {
      method: 'POST',
      version: 'v1',
      url: '/discoveries/process',
      handler: asyncRequestHandler<DiscoveryLocationRecord>(async ({ context: session, body }) => {
        return await discoveryApplication.processLocation(session, body?.locationWithDirection, body?.trailId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/discovery/collections/discoveries',
      handler: asyncRequestHandler<Discovery[]>(async ({ context: session, query }) => {
        return await discoveryApplication.getDiscoveries(session, query?.trailId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/discovery/collections/spots',
      handler: asyncRequestHandler<Spot[]>(async ({ context: session, query }) => {
        return await discoveryApplication.getDiscoveredSpots(session, query?.trailId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/discovery/collections/trails/:trailId/clues',
      handler: asyncRequestHandler<Clue[], { trailId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.getDiscoveredPreviewClues(session, params!.trailId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/discovery/collections/trails/:trailId',
      handler: asyncRequestHandler<DiscoveryTrail, { trailId: string }>(async ({ context: session, params }) => {
        return await discoveryApplication.getDiscoveryTrail(session, params!.trailId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/discovery/profile',
      handler: asyncRequestHandler<DiscoveryProfile>(async ({ context: session }) => {
        return await discoveryApplication.getDiscoveryProfile(session)
      }),
    },
    {
      method: 'PUT',
      version: 'v1',
      url: '/discovery/profile',
      handler: asyncRequestHandler<DiscoveryProfile>(async ({ context: session, body }) => {
        return await discoveryApplication.updateDiscoveryProfile(session, body)
      }),
    },

    // Trail API Routes (Authenticated)
    {
      method: 'GET',
      version: 'v1',
      url: '/trail/collections/trails',
      handler: asyncRequestHandler<Trail[]>(async ({ context }) => {
        return await trailApplication.listTrails(context)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/trail/collections/trails/:id',
      handler: asyncRequestHandler<Trail | undefined, { id: string }, never>(async ({ params, context }) => {
        return await trailApplication.getTrail(context, params!.id)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/trail/collections/spots',
      handler: asyncRequestHandler<Spot[]>(async ({ context, query }) => {
        return await trailApplication.listSpots(context, query?.trailId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/trail/collections/spot-previews',
      handler: asyncRequestHandler<SpotPreview[]>(async ({ context, query }) => {
        return await trailApplication.listSpotPreviews(context, query?.trailId)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/trail/collections/spots/:id',
      handler: asyncRequestHandler<Spot | undefined, { id: string }, never>(async ({ params, context }) => {
        return await trailApplication.getSpot(context, params!.id)
      }),
    },

    // Sensor API Routes (Authenticated)
    {
      method: 'GET',
      version: 'v1',
      url: '/sensor/collections/scans',
      handler: asyncRequestHandler(async ({ context, query }) => {
        return await sensorApplication.listScanEvents(context, query?.trailId)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/sensor/collections/scans',
      handler: asyncRequestHandler<ScanEvent>(async ({ context: session, body }) => {
        return await sensorApplication.createScanEvent(session, body?.userPosition, body?.trailId)
      }),
    },

    // Account API Routes (Mixed authentication requirements)
    {
      method: 'POST',
      version: 'v1',
      url: '/account/sms/request',
      config: { isPublic: true },
      handler: asyncRequestHandler<SMSCodeRequest>(async ({ body }) => {
        return await accountApplication.requestSMSCode(body?.phoneNumber)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/sms/verify',
      config: { isPublic: true },
      handler: asyncRequestHandler<SMSVerificationResult>(async ({ body }) => {
        return await accountApplication.verifySMSCode(body?.phoneNumber, body?.code)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/account/collections/accounts',
      handler: asyncRequestHandler<Account | null>(async ({ context }) => {
        return await accountApplication.getAccount(context)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/account/collections/accounts/:accountId',
      handler: asyncRequestHandler<Account | null, { accountId: string }, never>(async ({ context }) => {
        return await accountApplication.getAccount(context)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/session/validate',
      config: { isPublic: true },
      handler: asyncRequestHandler(async ({ body }) => {
        return await accountApplication.validateSession(body?.sessionToken)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/session/revoke',
      config: { isPublic: true },
      handler: asyncRequestHandler(async ({ body }) => {
        return await accountApplication.revokeSession(body?.sessionToken)
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/local-account',
      config: { isPublic: true },
      handler: asyncRequestHandler(async () => {
        return await accountApplication.createLocalAccount()
      }),
    },
    {
      method: 'POST',
      version: 'v1',
      url: '/account/upgrade-account',
      handler: asyncRequestHandler(async ({ context, body }) => {
        return await accountApplication.upgradeToPhoneAccount(context, body?.phoneNumber, body?.code)
      }),
    },
    {
      method: 'GET',
      version: 'v1',
      url: '/account/config/firebase',
      handler: asyncRequestHandler<FirebaseConfig>(async ({ context }) => {
        return await accountApplication.getFirebaseConfig(context)
      }),
    },
  ]
}
export default createRoutes
