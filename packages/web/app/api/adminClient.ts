/**
 * Admin API client with authentication.
 * Requires ADMIN_TOKEN to be set in localStorage.
 */

const ADMIN_TOKEN_KEY = 'ferthe_admin_token';
const ADMIN_ACCOUNT_ID_KEY = 'ferthe_admin_account_id';

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_ACCOUNT_ID_KEY);
}

export function setAdminAccountId(accountId: string) {
  localStorage.setItem(ADMIN_ACCOUNT_ID_KEY, accountId);
}

export function getAdminAccountId(): string | null {
  return localStorage.getItem(ADMIN_ACCOUNT_ID_KEY);
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();

  if (!token) {
    throw new Error('Admin token not set. Please login first.');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
  }

  return response.json();
}

export const adminApi = {
  // Authentication
  async requestSMSCode(phoneNumber: string) {
    const response = await fetch('/admin/api/v1/account/actions/request-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });
    if (!response.ok) {
      throw new Error('Failed to send SMS code');
    }
    return response.json();
  },

  async verifySMSCode(phoneNumber: string, code: string) {
    const response = await fetch('/admin/api/v1/account/actions/verify-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, code }),
    });
    if (!response.ok) {
      throw new Error('Failed to verify code');
    }
    return response.json();
  },

  // Spots
  getSpots() {
    return request('/admin/api/v1/spot/spots');
  },

  getSpot(id: string) {
    return request(`/admin/api/v1/spot/spots/${id}`);
  },

  createSpot(data: any) {
    return request('/admin/api/v1/spot/spots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSpot(id: string, data: any) {
    return request(`/admin/api/v1/spot/spots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteSpot(id: string) {
    return request(`/admin/api/v1/spot/spots/${id}`, {
      method: 'DELETE',
    });
  },

  // Trails
  getTrails(createdBy?: string) {
    const url = createdBy
      ? `/admin/api/v1/trail/trails?createdBy=${encodeURIComponent(createdBy)}`
      : '/admin/api/v1/trail/trails';
    return request(url);
  },

  getTrail(id: string) {
    return request(`/admin/api/v1/trail/trails/${id}`);
  },

  createTrail(data: any) {
    return request('/admin/api/v1/trail/trails', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTrail(id: string, data: any) {
    return request(`/admin/api/v1/trail/trails/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteTrail(id: string) {
    return request(`/admin/api/v1/trail/trails/${id}`, {
      method: 'DELETE',
    });
  },

  // Trail-Spot relationships
  getTrailSpots(trailId: string) {
    return request(`/admin/api/v1/trail/trails/${trailId}/spots`);
  },

  addSpotToTrail(trailId: string, spotId: string, order?: number) {
    return request(`/admin/api/v1/trail/trails/${trailId}/spots/${spotId}`, {
      method: 'POST',
      body: JSON.stringify({ order }),
    });
  },

  removeSpotFromTrail(trailId: string, spotId: string) {
    return request(`/admin/api/v1/trail/trails/${trailId}/spots/${spotId}`, {
      method: 'DELETE',
    });
  },
};
