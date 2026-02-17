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
export const ERROR_CODES = {
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
  SMS_CONNECTOR_NOT_CONFIGURED: { code: 'SMS_CONNECTOR_NOT_CONFIGURED', message: 'SMS connector is not configured', httpStatus: 500 },
  PHONE_ALREADY_USED: { code: 'PHONE_ALREADY_USED', message: 'Phone number is already associated with another account', httpStatus: 409 },

  // Account Management (404-409)
  ACCOUNT_NOT_FOUND: { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found', httpStatus: 404 },
  ALREADY_VERIFIED: { code: 'ALREADY_VERIFIED', message: 'Account is already phone verified', httpStatus: 409 },
  // Discovery & Trail Management (404-500)
  TRAIL_NOT_FOUND: { code: 'TRAIL_NOT_FOUND', message: 'Trail not found', httpStatus: 404 },
  DISCOVERY_NOT_FOUND: { code: 'DISCOVERY_NOT_FOUND', message: 'Discovery not found', httpStatus: 404 },
  GET_DISCOVERIES_ERROR: { code: 'GET_DISCOVERIES_ERROR', message: 'Failed to retrieve discoveries', httpStatus: 500 },
  GET_DISCOVERY_ERROR: { code: 'GET_DISCOVERY_ERROR', message: 'Failed to retrieve discovery', httpStatus: 500 },
  GET_DISCOVERY_STATS_ERROR: { code: 'GET_DISCOVERY_STATS_ERROR', message: 'Failed to retrieve discovery statistics', httpStatus: 500 },
  GET_TRAIL_STATS_ERROR: { code: 'GET_TRAIL_STATS_ERROR', message: 'Failed to retrieve trail statistics', httpStatus: 500 },
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

  // Discovery Content & Reactions (400-500)
  CONTENT_ALREADY_EXISTS: { code: 'CONTENT_ALREADY_EXISTS', message: 'Content already exists for this discovery', httpStatus: 409 },
  CONTENT_NOT_FOUND: { code: 'CONTENT_NOT_FOUND', message: 'Discovery content not found', httpStatus: 404 },
  ADD_CONTENT_ERROR: { code: 'ADD_CONTENT_ERROR', message: 'Failed to add discovery content', httpStatus: 500 },
  GET_CONTENT_ERROR: { code: 'GET_CONTENT_ERROR', message: 'Failed to retrieve discovery content', httpStatus: 500 },
  UPDATE_CONTENT_ERROR: { code: 'UPDATE_CONTENT_ERROR', message: 'Failed to update discovery content', httpStatus: 500 },
  SAVE_CONTENT_ERROR: { code: 'SAVE_CONTENT_ERROR', message: 'Failed to save discovery content', httpStatus: 500 },
  NOT_AUTHORIZED: { code: 'NOT_AUTHORIZED', message: 'User is not authorized for this action', httpStatus: 403 },
  INVALID_RATING: { code: 'INVALID_RATING', message: 'Rating must be between 1 and 5', httpStatus: 400 },
  RATE_ERROR: { code: 'RATE_ERROR', message: 'Failed to rate spot', httpStatus: 500 },
  SAVE_RATING_ERROR: { code: 'SAVE_RATING_ERROR', message: 'Failed to save rating', httpStatus: 500 },
  REMOVE_RATING_ERROR: { code: 'REMOVE_RATING_ERROR', message: 'Failed to remove rating', httpStatus: 500 },
  GET_RATINGS_ERROR: { code: 'GET_RATINGS_ERROR', message: 'Failed to retrieve ratings', httpStatus: 500 },
  GET_RATING_SUMMARY_ERROR: { code: 'GET_RATING_SUMMARY_ERROR', message: 'Failed to retrieve rating summary', httpStatus: 500 },
  STORAGE_CONNECTOR_NOT_CONFIGURED: { code: 'STORAGE_CONNECTOR_NOT_CONFIGURED', message: 'Storage connector is not configured', httpStatus: 500 },
  IMAGE_UPLOAD_ERROR: { code: 'IMAGE_UPLOAD_ERROR', message: 'Failed to upload image', httpStatus: 500 },
  DELETE_CONTENT_ERROR: { code: 'DELETE_CONTENT_ERROR', message: 'Failed to delete discovery content', httpStatus: 500 },
  DELETE_IMAGE_ERROR: { code: 'DELETE_IMAGE_ERROR', message: 'Failed to delete image', httpStatus: 500 },
  INVALID_IMAGE_FORMAT: { code: 'INVALID_IMAGE_FORMAT', message: 'Unsupported image format', httpStatus: 400 },
  REFRESH_IMAGE_URL_ERROR: { code: 'REFRESH_IMAGE_URL_ERROR', message: 'Failed to refresh image URL', httpStatus: 500 },
  NO_IMAGE_DATA: { code: 'NO_IMAGE_DATA', message: 'No image data provided', httpStatus: 400 },
  IMAGE_TOO_LARGE: { code: 'IMAGE_TOO_LARGE', message: 'Image size exceeds maximum allowed size', httpStatus: 413 },
  IMAGE_UPLOAD_FAILED: { code: 'IMAGE_UPLOAD_FAILED', message: 'Image upload failed', httpStatus: 500 },
  IMAGE_APPLICATION_NOT_CONFIGURED: { code: 'IMAGE_APPLICATION_NOT_CONFIGURED', message: 'Image application is not configured', httpStatus: 500 },
  AVATAR_UPLOAD_ERROR: { code: 'AVATAR_UPLOAD_ERROR', message: 'Failed to upload avatar', httpStatus: 500 },

  // Community Management (404-500)
  COMMUNITY_NOT_FOUND: { code: 'COMMUNITY_NOT_FOUND', message: 'Community not found', httpStatus: 404 },
  NOT_A_MEMBER: { code: 'NOT_A_MEMBER', message: 'User is not a member of this community', httpStatus: 403 },
  NOT_CREATOR: { code: 'NOT_CREATOR', message: 'User is not the creator of this community', httpStatus: 403 },
  ALREADY_MEMBER: { code: 'ALREADY_MEMBER', message: 'User is already a member of this community', httpStatus: 409 },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', message: 'User is not authorized for this action', httpStatus: 403 },
  TRAIL_REQUIRED: { code: 'TRAIL_REQUIRED', message: 'At least one trail ID is required', httpStatus: 400 },
  TOO_MANY_TRAILS: { code: 'TOO_MANY_TRAILS', message: 'Too many trails provided (maximum 1)', httpStatus: 400 },
  DISCOVERY_TRAIL_NOT_IN_COMMUNITY: { code: 'DISCOVERY_TRAIL_NOT_IN_COMMUNITY', message: 'Discovery trail is not part of community trails', httpStatus: 400 },
  DISCOVERY_SPOT_NOT_IN_COMMUNITY_TRAILS: { code: 'DISCOVERY_SPOT_NOT_IN_COMMUNITY_TRAILS', message: 'Discovery spot is not part of any community trail', httpStatus: 400 },
  DISCOVERY_TOO_OLD: { code: 'DISCOVERY_TOO_OLD', message: 'Discovery is too old to share (maximum 24 hours)', httpStatus: 400 },
  ALREADY_SHARED: { code: 'ALREADY_SHARED', message: 'Discovery is already shared in this community', httpStatus: 409 },
  SHARED_DISCOVERY_NOT_FOUND: { code: 'SHARED_DISCOVERY_NOT_FOUND', message: 'Shared discovery not found', httpStatus: 404 },
  CREATE_COMMUNITY_ERROR: { code: 'CREATE_COMMUNITY_ERROR', message: 'Failed to create community', httpStatus: 500 },
  JOIN_COMMUNITY_ERROR: { code: 'JOIN_COMMUNITY_ERROR', message: 'Failed to join community', httpStatus: 500 },
  LEAVE_COMMUNITY_ERROR: { code: 'LEAVE_COMMUNITY_ERROR', message: 'Failed to leave community', httpStatus: 500 },
  REMOVE_COMMUNITY_ERROR: { code: 'REMOVE_COMMUNITY_ERROR', message: 'Failed to remove community', httpStatus: 500 },
  GET_COMMUNITY_ERROR: { code: 'GET_COMMUNITY_ERROR', message: 'Failed to retrieve community', httpStatus: 500 },
  GET_COMMUNITIES_ERROR: { code: 'GET_COMMUNITIES_ERROR', message: 'Failed to retrieve communities', httpStatus: 500 },
  GET_MEMBERS_ERROR: { code: 'GET_MEMBERS_ERROR', message: 'Failed to retrieve community members', httpStatus: 500 },
  SHARE_DISCOVERY_ERROR: { code: 'SHARE_DISCOVERY_ERROR', message: 'Failed to share discovery', httpStatus: 500 },
  UNSHARE_DISCOVERY_ERROR: { code: 'UNSHARE_DISCOVERY_ERROR', message: 'Failed to unshare discovery', httpStatus: 500 },
  GET_SHARED_DISCOVERIES_ERROR: { code: 'GET_SHARED_DISCOVERIES_ERROR', message: 'Failed to retrieve shared discoveries', httpStatus: 500 },

  // Server Errors (500)
  REQUEST_SMS_CODE_ERROR: { code: 'REQUEST_SMS_CODE_ERROR', message: 'Failed to request SMS code', httpStatus: 500 },
  VERIFY_SMS_CODE_ERROR: { code: 'VERIFY_SMS_CODE_ERROR', message: 'Failed to verify SMS code', httpStatus: 500 },
  REFRESH_SESSION_ERROR: { code: 'REFRESH_SESSION_ERROR', message: 'Failed to refresh session', httpStatus: 500 },
  VALIDATE_SESSION_ERROR: { code: 'VALIDATE_SESSION_ERROR', message: 'Failed to validate session', httpStatus: 500 },
  REVOKE_SESSION_ERROR: { code: 'REVOKE_SESSION_ERROR', message: 'Failed to revoke session', httpStatus: 500 },
  GET_ACCOUNT_ERROR: { code: 'GET_ACCOUNT_ERROR', message: 'Failed to get account', httpStatus: 500 },
  UPDATE_ACCOUNT_ERROR: { code: 'UPDATE_ACCOUNT_ERROR', message: 'Failed to update account', httpStatus: 500 },
  CREATE_LOCAL_ACCOUNT_ERROR: { code: 'CREATE_LOCAL_ACCOUNT_ERROR', message: 'Failed to create local account', httpStatus: 500 },
  UPGRADE_ACCOUNT_ERROR: { code: 'UPGRADE_ACCOUNT_ERROR', message: 'Failed to upgrade account', httpStatus: 500 },

  // Sensor & Scanning (400-500)
  TRAIL_ID_REQUIRED: { code: 'TRAIL_ID_REQUIRED', message: 'Trail ID is required', httpStatus: 400 },
  CREATE_SCAN_EVENT_ERROR: { code: 'CREATE_SCAN_EVENT_ERROR', message: 'Failed to create scan event', httpStatus: 500 },
  LIST_SCAN_EVENTS_ERROR: { code: 'LIST_SCAN_EVENTS_ERROR', message: 'Failed to list scan events', httpStatus: 500 },
} as const

export type ApiErrorCode = keyof typeof ERROR_CODES

/**
 * Create a standardized API error
 */
export function createApiError(code: ApiErrorCode, details?: any): ApiError {
  const errorDef = ERROR_CODES[code]
  return {
    ...errorDef,
    details,
  }
}

