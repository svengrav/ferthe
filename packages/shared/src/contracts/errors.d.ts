/**
 * Standardized error codes and HTTP status mappings for API responses
 */
export interface ApiError {
    code: string;
    message: string;
    httpStatus: number;
    details?: any;
}
/**
 * Standardized API error codes with messages and HTTP status
 * This object maps error codes to their corresponding messages and HTTP status codes.
 */
export declare const API_ERROR_CODES: {
    readonly ACCOUNT_ID_REQUIRED: {
        readonly code: "ACCOUNT_ID_REQUIRED";
        readonly message: "Account ID is required";
        readonly httpStatus: 401;
    };
    readonly INVALID_REFRESH_TOKEN: {
        readonly code: "INVALID_REFRESH_TOKEN";
        readonly message: "Invalid refresh token";
        readonly httpStatus: 401;
    };
    readonly SESSION_INVALID: {
        readonly code: "SESSION_INVALID";
        readonly message: "Session is invalid or expired";
        readonly httpStatus: 401;
    };
    readonly INVALID_PHONE_NUMBER: {
        readonly code: "INVALID_PHONE_NUMBER";
        readonly message: "Invalid phone number format";
        readonly httpStatus: 400;
    };
    readonly NO_SMS_REQUEST: {
        readonly code: "NO_SMS_REQUEST";
        readonly message: "No SMS request found for this phone number";
        readonly httpStatus: 400;
    };
    readonly INVALID_SMS_CODE: {
        readonly code: "INVALID_SMS_CODE";
        readonly message: "Invalid or expired SMS code";
        readonly httpStatus: 400;
    };
    readonly SMS_CODE_EXPIRED: {
        readonly code: "SMS_CODE_EXPIRED";
        readonly message: "SMS code has expired";
        readonly httpStatus: 400;
    };
    readonly SMS_CODE_ALREADY_VERIFIED: {
        readonly code: "SMS_CODE_ALREADY_VERIFIED";
        readonly message: "SMS code already verified";
        readonly httpStatus: 400;
    };
    readonly PHONE_ALREADY_USED: {
        readonly code: "PHONE_ALREADY_USED";
        readonly message: "Phone number is already associated with another account";
        readonly httpStatus: 409;
    };
    readonly ACCOUNT_NOT_FOUND: {
        readonly code: "ACCOUNT_NOT_FOUND";
        readonly message: "Account not found";
        readonly httpStatus: 404;
    };
    readonly ALREADY_VERIFIED: {
        readonly code: "ALREADY_VERIFIED";
        readonly message: "Account is already phone verified";
        readonly httpStatus: 409;
    };
    readonly TRAIL_NOT_FOUND: {
        readonly code: "TRAIL_NOT_FOUND";
        readonly message: "Trail not found";
        readonly httpStatus: 404;
    };
    readonly DISCOVERY_NOT_FOUND: {
        readonly code: "DISCOVERY_NOT_FOUND";
        readonly message: "Discovery not found";
        readonly httpStatus: 404;
    };
    readonly GET_DISCOVERIES_ERROR: {
        readonly code: "GET_DISCOVERIES_ERROR";
        readonly message: "Failed to retrieve discoveries";
        readonly httpStatus: 500;
    };
    readonly GET_DISCOVERY_ERROR: {
        readonly code: "GET_DISCOVERY_ERROR";
        readonly message: "Failed to retrieve discovery";
        readonly httpStatus: 500;
    };
    readonly GET_SPOT_IDS_ERROR: {
        readonly code: "GET_SPOT_IDS_ERROR";
        readonly message: "Failed to retrieve discovered spot IDs";
        readonly httpStatus: 500;
    };
    readonly GET_SPOTS_ERROR: {
        readonly code: "GET_SPOTS_ERROR";
        readonly message: "Failed to retrieve discovered spots";
        readonly httpStatus: 500;
    };
    readonly GET_CLUES_ERROR: {
        readonly code: "GET_CLUES_ERROR";
        readonly message: "Failed to retrieve preview clues";
        readonly httpStatus: 500;
    };
    readonly DISCOVERY_TRAIL_ERROR: {
        readonly code: "DISCOVERY_TRAIL_ERROR";
        readonly message: "Failed to retrieve discovery trail";
        readonly httpStatus: 500;
    };
    readonly PROCESS_LOCATION_ERROR: {
        readonly code: "PROCESS_LOCATION_ERROR";
        readonly message: "Failed to process location for discoveries";
        readonly httpStatus: 500;
    };
    readonly PROFILE_NOT_FOUND: {
        readonly code: "PROFILE_NOT_FOUND";
        readonly message: "Discovery profile not found";
        readonly httpStatus: 404;
    };
    readonly GET_PROFILE_ERROR: {
        readonly code: "GET_PROFILE_ERROR";
        readonly message: "Failed to retrieve discovery profile";
        readonly httpStatus: 500;
    };
    readonly UPDATE_PROFILE_ERROR: {
        readonly code: "UPDATE_PROFILE_ERROR";
        readonly message: "Failed to update discovery profile";
        readonly httpStatus: 500;
    };
    readonly UPDATE_TRAIL_ERROR: {
        readonly code: "UPDATE_TRAIL_ERROR";
        readonly message: "Failed to update last active trail";
        readonly httpStatus: 500;
    };
    readonly REQUEST_SMS_CODE_ERROR: {
        readonly code: "REQUEST_SMS_CODE_ERROR";
        readonly message: "Failed to request SMS code";
        readonly httpStatus: 500;
    };
    readonly VERIFY_SMS_CODE_ERROR: {
        readonly code: "VERIFY_SMS_CODE_ERROR";
        readonly message: "Failed to verify SMS code";
        readonly httpStatus: 500;
    };
    readonly REFRESH_SESSION_ERROR: {
        readonly code: "REFRESH_SESSION_ERROR";
        readonly message: "Failed to refresh session";
        readonly httpStatus: 500;
    };
    readonly VALIDATE_SESSION_ERROR: {
        readonly code: "VALIDATE_SESSION_ERROR";
        readonly message: "Failed to validate session";
        readonly httpStatus: 500;
    };
    readonly REVOKE_SESSION_ERROR: {
        readonly code: "REVOKE_SESSION_ERROR";
        readonly message: "Failed to revoke session";
        readonly httpStatus: 500;
    };
    readonly GET_ACCOUNT_ERROR: {
        readonly code: "GET_ACCOUNT_ERROR";
        readonly message: "Failed to get account";
        readonly httpStatus: 500;
    };
    readonly CREATE_LOCAL_ACCOUNT_ERROR: {
        readonly code: "CREATE_LOCAL_ACCOUNT_ERROR";
        readonly message: "Failed to create local account";
        readonly httpStatus: 500;
    };
    readonly UPGRADE_ACCOUNT_ERROR: {
        readonly code: "UPGRADE_ACCOUNT_ERROR";
        readonly message: "Failed to upgrade account";
        readonly httpStatus: 500;
    };
};
export type ApiErrorCode = keyof typeof API_ERROR_CODES;
/**
 * Create a standardized API error
 */
export declare function createApiError(code: ApiErrorCode, details?: any): ApiError;
/**
 * Create a DataResult with standardized error
 */
export declare function createErrorResult<T>(code: ApiErrorCode, details?: any): {
    success: false;
    error: ApiError;
};
/**
 * Create a successful DataResult
 */
export declare function createSuccessResult<T>(data: T): {
    success: true;
    data: T;
};
