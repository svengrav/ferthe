
/**
 * Helper function to construct a valid API URL with prefix, version, and route URL
 * Ensures no double slashes and proper slash placement
 * Test examples for buildApiUrl function:
 * buildApiUrl('/api', 'v1', '/users') → '/core/api/v1/users'
 * buildApiUrl('/api/', '/v1/', '/users/') → '/core/api/v1/users'
 * buildApiUrl('api', 'v1', 'users') → '/core/api/v1/users'
 * buildApiUrl('/api', '', '/users') → '/api/users'
 * buildApiUrl('/api', 'v1', '') → '/api/v1'
 * 
 * @param basePrefix - Base API prefix (e.g., '/api')
 * @param version - API version (e.g., 'v1', '/v1')
 * @param routeUrl - Route URL (e.g., '/users', 'users')
 * @returns Properly formatted URL
 */
const buildApiUrl = (basePrefix: string, version?: string, routeUrl?: string): string => {
  // Normalize all parts by removing leading/trailing slashes
  const normalizeSegment = (segment: string | undefined): string => {
    if (!segment) return ''
    return segment.replace(/^\/+|\/+$/g, '')
  }

  const prefix = normalizeSegment(basePrefix)
  const ver = normalizeSegment(version)
  const url = normalizeSegment(routeUrl)

  // Build URL segments array
  const segments = [prefix, ver, url].filter(segment => segment.length > 0)

  // Join with single slashes and ensure leading slash
  return '/' + segments.join('/')
}

const serverUtils = {
  buildApiUrl,
}

export default serverUtils