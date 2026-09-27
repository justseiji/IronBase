const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  constructor(message, { status = 0, field = null, network = false } = {}) {
    super(message);
    this.status = status;
    this.field = field;
    this.network = network;
  }
}

const NETWORK_MESSAGE = 'Unable to connect to the server.';

/**
 * JSON request to the IronBase API. The session travels as an HttpOnly
 * cookie, so no credentials are ever handled in JavaScript.
 */
export async function apiRequest(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(API_BASE_URL + path, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(NETWORK_MESSAGE, { network: true });
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON responses come from a proxy/gateway, not the API itself.
  }

  if (!res.ok) {
    if (res.status >= 500 && !data) throw new ApiError(NETWORK_MESSAGE, { status: res.status, network: true });
    const message = res.status >= 500 ? 'Something went wrong. Please try again.' : data?.error || 'Request failed.';
    throw new ApiError(message, { status: res.status, field: data?.field ?? null });
  }
  return data;
}
