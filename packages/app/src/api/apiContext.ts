import {
  Account,
  AccountContext,
  AccountSession,
  ApplicationContract,
  Clue,
  Discovery,
  DiscoveryLocationRecord,
  DiscoveryProfile,
  DiscoveryProfileUpdateData,
  DiscoveryTrail,
  FirebaseConfig,
  LocationWithDirection,
  Result,
  ScanEvent,
  SessionValidationResult,
  SMSCodeRequest,
  SMSVerificationResult,
  Spot,
  SpotPreview,
  Trail,
} from '@shared/contracts'

export interface ApiContextOptions {
  apiEndpoint: string
  environment?: 'production' | 'development' | 'test'
  getAccountSession: () => AccountSession | null
}

interface CoreConfiguration {
  environment?: 'production' | 'development' | 'test'
}

export type APIContext = Omit<ApplicationContract, 'spotApplication'> & {
  readonly config: CoreConfiguration
}

// Base API Client Factory
const createAPIClient = (apiEndpoint: string, getAccountSession: () => AccountSession | null) => {
  const send = async <T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> => {
    const credentials = getAccountSession()

    const headers: HeadersInit = {}
    if (body) {
      headers['Content-Type'] = 'application/json' // Set content type for JSON body
    }

    if (credentials?.sessionToken) {
      headers['Authorization'] = `Bearer ${credentials.sessionToken}`
    }

    const response = await fetch(`${apiEndpoint}${endpoint}`, {
      method: method.toUpperCase(), // Ensure HTTP method is uppercase
      headers,
      body: body ? JSON.stringify(body) : null, // Ensure body is always a JSON string
    })

    return response.json()
  }

  return { send }
}

// Main API Context Factory
export const createApiContext = (options: ApiContextOptions): APIContext => {
  const { apiEndpoint, environment = 'production', getAccountSession: getAccountSession } = options
  const API = createAPIClient(apiEndpoint, getAccountSession)

  return {
    config: { environment },

    /**
     * Discovery Application API Methods
     * These methods handle discovery processing, retrieval of discoveries, and related data.
     * They are designed to be used in the context of discovery management and user interactions.
     * They require an account context to access user-specific data.
     */
    discoveryApplication: {
      processLocation: (_context: AccountContext, locationWithDirection: LocationWithDirection, trailId: string) =>
        API.send<Result<DiscoveryLocationRecord>>('/discoveries/process', 'POST', { locationWithDirection, trailId }),

      getDiscoveries: (_context: AccountContext, trailId?: string) => {
        const params = trailId ? `?trailId=${trailId}` : ''
        return API.send<Result<Discovery[]>>(`/discovery/collections/discoveries${params}`)
      },

      getDiscovery: (_context: AccountContext, discoveryId: string) => API.send<Result<Discovery>>(`/discovery/collections/discoveries/${discoveryId}`),

      getDiscoveredSpots: (_context: AccountContext, trailId?: string) => {
        const params = trailId ? `?trailId=${trailId}` : ''
        return API.send<Result<Spot[]>>(`/discovery/collections/spots${params}`)
      },

      getDiscoveredSpotIds: async (_context: AccountContext, trailId?: string) => {
        const discoveries = await API.send<Result<Discovery[]>>(`/discovery/collections/discoveries${trailId ? `?trailId=${trailId}` : ''}`)
        return { data: discoveries.data?.map(d => d.spotId) || [] }
      },

      getDiscoveredPreviewClues: (_context: AccountContext, trailId: string) => API.send<Result<Clue[]>>(`/discovery/collections/trails/${trailId}/clues`),

      getDiscoveryTrail: (_context: AccountContext, trailId: string) => API.send<Result<DiscoveryTrail>>(`/discovery/collections/trails/${trailId}`),

      // Profile methods
      getDiscoveryProfile: (_context: AccountContext) => API.send<Result<DiscoveryProfile>>('/discovery/profile'),

      updateDiscoveryProfile: (_context: AccountContext, updateData: DiscoveryProfileUpdateData) => API.send<Result<DiscoveryProfile>>('/discovery/profile', 'PUT', updateData),
    },

    /**
     * Trail Application API Methods
     * These methods handle trail and spot management.
     * They are designed to be used in the context of trail and spot data management.
     */
    trailApplication: {
      listTrails: (_context: AccountContext) => API.send<Result<Trail[]>>('/trail/collections/trails'),

      getTrail: async (_context: AccountContext, id: string) => {
        try {
          return await API.send<Result<Trail | undefined>>(`/trail/collections/trails/${id}`)
        } catch (error: any) {
          if (error.message.includes('404')) return { data: undefined }
          throw error
        }
      },

      createTrail: (_context: AccountContext, trail: any) => API.send<Result<Trail>>('/trail/collections/trails', 'POST', trail),

      listSpots: (_context: AccountContext) => API.send<Result<Spot[]>>('/trail/collections/spots'),

      getSpot: async (_context: AccountContext, id: string) => {
        try {
          return await API.send<Result<Spot | undefined>>(`/trail/collections/spots/${id}`)
        } catch (error: any) {
          if (error.message.includes('404')) return { data: undefined }
          throw error
        }
      },

      listSpotPreviews: (_context: AccountContext, trailId?: string) => {
        const params = trailId ? `?trailId=${trailId}` : ''
        return API.send<Result<SpotPreview[]>>(`/trail/collections/spot-previews${params}`)
      },

      createSpot: (_context: AccountContext, spot: any) => API.send<Result<Spot>>('/trail/collections/spots', 'POST', spot),
    },

    /**
     * Sensor Application API Methods
     * These methods handle user sensor data and interactions.
     * They are designed to be used in the context of user sensor management.
     */
    sensorApplication: {
      listScanEvents: (_context: AccountContext, trailId?: string) => {
        const params = trailId ? `?trailId=${trailId}` : ''
        return API.send<Result<ScanEvent[]>>(`/sensor/collections/scans${params}`)
      },

      createScanEvent: (_context: AccountContext, userPosition: any, trailId?: string) =>
        API.send<Result<ScanEvent>>('/sensor/collections/scans', 'POST', { userPosition, trailId }),
    },

    /**
     * Account Application API Methods
     * These methods handle account creation, session management, and SMS verification.
     * They are designed to be used in the context of user account management.
     */
    accountApplication: {
      requestSMSCode: (phoneNumber: string) => API.send<Result<SMSCodeRequest>>('/account/sms/request', 'POST', { phoneNumber }),

      verifySMSCode: (phoneNumber: string, code: string) => API.send<Result<SMSVerificationResult>>('/account/sms/verify', 'POST', { phoneNumber, code }),

      getAccount: async (_context: AccountContext) => {
        try {
          return await API.send<Result<Account | null>>('/account/collections/accounts')
        } catch (error: any) {
          if (error.message.includes('404')) return { data: null }
          throw error
        }
      },

      validateSession: (sessionToken: string) => API.send<Result<SessionValidationResult>>('/account/session/validate', 'POST', { sessionToken }),

      revokeSession: (sessionToken: string) => API.send<Result<void>>('/account/session/revoke', 'POST', { sessionToken }),

      createLocalAccount: () => API.send<Result<AccountSession>>('/account/local-account', 'POST'),

      upgradeToPhoneAccount: (_context: AccountContext, phoneNumber: string, code: string) =>
        API.send<Result<AccountSession>>('/account/upgrade-account', 'POST', { phoneNumber, code }),

      getFirebaseConfig: (_context: AccountContext) => API.send<Result<FirebaseConfig>>('/account/config/firebase'),
    },
  }
}
