/**
 * Standardized error codes and HTTP status mappings for API responses
 */

export interface ApiError {
  code: string
  message: string
  httpStatus: number
  details?: any
}

/**
 * Standardized API error codes with messages and HTTP status
 * This object maps error codes to their corresponding messages and HTTP status codes.
 */
export const API_ERROR_CODES = {
  // Authentication & Authorization (401-403)
  ACCOUNT_ID_REQUIRED: { code: 'ACCOUNT_ID_REQUIRED', message: 'Account ID is required', httpStatus: 401 },
  INVALID_REFRESH_TOKEN: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token', httpStatus: 401 },
  SESSION_INVALID: { code: 'SESSION_INVALID', message: 'Session is invalid or expired', httpStatus: 401 },

  // SMS Verification (400-409)
  INVALID_PHONE_NUMBER: { code: 'INVALID_PHONE_NUMBER', message: 'Invalid phone number format', httpStatus: 400 },
  NO_SMS_REQUEST: { code: 'NO_SMS_REQUEST', message: 'No SMS request found for this phone number', httpStatus: 400 },
  INVALID_SMS_CODE: { code: 'INVALID_SMS_CODE', message: 'Invalid or expired SMS code', httpStatus: 400 },
  SMS_CODE_EXPIRED: { code: 'SMS_CODE_EXPIRED', message: 'SMS code has expired', httpStatus: 400 },
  SMS_CODE_ALREADY_VERIFIED: { code: 'SMS_CODE_ALREADY_VERIFIED', message: 'SMS code already verified', httpStatus: 400 },
  PHONE_ALREADY_USED: { code: 'PHONE_ALREADY_USED', message: 'Phone number is already associated with another account', httpStatus: 409 },

  // Account Management (404-409)
  ACCOUNT_NOT_FOUND: { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found', httpStatus: 404 },
  ALREADY_VERIFIED: { code: 'ALREADY_VERIFIED', message: 'Account is already phone verified', httpStatus: 409 },
  // Discovery & Trail Management (404-500)
  TRAIL_NOT_FOUND: { code: 'TRAIL_NOT_FOUND', message: 'Trail not found', httpStatus: 404 },
  DISCOVERY_NOT_FOUND: { code: 'DISCOVERY_NOT_FOUND', message: 'Discovery not found', httpStatus: 404 },
  GET_DISCOVERIES_ERROR: { code: 'GET_DISCOVERIES_ERROR', message: 'Failed to retrieve discoveries', httpStatus: 500 },
  GET_DISCOVERY_ERROR: { code: 'GET_DISCOVERY_ERROR', message: 'Failed to retrieve discovery', httpStatus: 500 },
  GET_SPOT_IDS_ERROR: { code: 'GET_SPOT_IDS_ERROR', message: 'Failed to retrieve discovered spot IDs', httpStatus: 500 },
  GET_SPOTS_ERROR: { code: 'GET_SPOTS_ERROR', message: 'Failed to retrieve discovered spots', httpStatus: 500 },
  GET_CLUES_ERROR: { code: 'GET_CLUES_ERROR', message: 'Failed to retrieve preview clues', httpStatus: 500 },
  DISCOVERY_TRAIL_ERROR: { code: 'DISCOVERY_TRAIL_ERROR', message: 'Failed to retrieve discovery trail', httpStatus: 500 },
  PROCESS_LOCATION_ERROR: { code: 'PROCESS_LOCATION_ERROR', message: 'Failed to process location for discoveries', httpStatus: 500 },

  // Discovery Profile Management (404-500)
  PROFILE_NOT_FOUND: { code: 'PROFILE_NOT_FOUND', message: 'Discovery profile not found', httpStatus: 404 },
  GET_PROFILE_ERROR: { code: 'GET_PROFILE_ERROR', message: 'Failed to retrieve discovery profile', httpStatus: 500 },
  UPDATE_PROFILE_ERROR: { code: 'UPDATE_PROFILE_ERROR', message: 'Failed to update discovery profile', httpStatus: 500 },
  UPDATE_TRAIL_ERROR: { code: 'UPDATE_TRAIL_ERROR', message: 'Failed to update last active trail', httpStatus: 500 },

  // Server Errors (500)
  REQUEST_SMS_CODE_ERROR: { code: 'REQUEST_SMS_CODE_ERROR', message: 'Failed to request SMS code', httpStatus: 500 },
  VERIFY_SMS_CODE_ERROR: { code: 'VERIFY_SMS_CODE_ERROR', message: 'Failed to verify SMS code', httpStatus: 500 },
  REFRESH_SESSION_ERROR: { code: 'REFRESH_SESSION_ERROR', message: 'Failed to refresh session', httpStatus: 500 },
  VALIDATE_SESSION_ERROR: { code: 'VALIDATE_SESSION_ERROR', message: 'Failed to validate session', httpStatus: 500 },
  REVOKE_SESSION_ERROR: { code: 'REVOKE_SESSION_ERROR', message: 'Failed to revoke session', httpStatus: 500 },
  GET_ACCOUNT_ERROR: { code: 'GET_ACCOUNT_ERROR', message: 'Failed to get account', httpStatus: 500 },
  CREATE_LOCAL_ACCOUNT_ERROR: { code: 'CREATE_LOCAL_ACCOUNT_ERROR', message: 'Failed to create local account', httpStatus: 500 },
  UPGRADE_ACCOUNT_ERROR: { code: 'UPGRADE_ACCOUNT_ERROR', message: 'Failed to upgrade account', httpStatus: 500 },
} as const

export type ApiErrorCode = keyof typeof API_ERROR_CODES

/**
 * Create a standardized API error
 */
export function createApiError(code: ApiErrorCode, details?: any): ApiError {
  const errorDef = API_ERROR_CODES[code]
  return {
    ...errorDef,
    details,
  }
}

/**
 * Create a DataResult with standardized error
 */
export function createErrorResult<T>(code: ApiErrorCode, details?: any): { success: false; error: ApiError } {
  return {
    success: false,
    error: createApiError(code, details),
  }
}

/**
 * Create a successful DataResult
 */
export function createSuccessResult<T>(data: T): { success: true; data: T } {
  return {
    success: true,
    data,
  }
}
