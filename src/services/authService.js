import { apiRequest } from './apiClient.js';

// Non-secret profile of the signed-in account, so a device that has already
// signed in can open its local data while offline. The session itself lives
// only in an HttpOnly cookie.
const ACCOUNT_KEY = 'ironbase-account';
const KNOWN_DEVICE_KEY = 'ironbase-has-signed-in';

export function isKnownDevice() {
  try { return localStorage.getItem(KNOWN_DEVICE_KEY) === '1'; } catch { return false; }
}

export function getStoredAccount() {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    const account = raw ? JSON.parse(raw) : null;
    return account?.id ? { id: account.id, email: account.email, username: account.username } : null;
  } catch {
    return null;
  }
}

export function storeAccount(user) {
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ id: user.id, email: user.email, username: user.username }));
    localStorage.setItem(KNOWN_DEVICE_KEY, '1');
  } catch {
    // Without storage the app still works online; it just can't start offline.
  }
}

export function clearStoredAccount() {
  try {
    localStorage.removeItem(ACCOUNT_KEY);
  } catch {
    // Nothing stored.
  }
}

export async function signUp({ email, username, password }) {
  const { user } = await apiRequest('/auth/signup', { method: 'POST', body: { email, username, password } });
  return user;
}

export async function signIn({ identifier, password }) {
  const { user } = await apiRequest('/auth/signin', { method: 'POST', body: { identifier, password } });
  return user;
}

export async function requestPasswordReset(email) {
  await apiRequest('/auth/forgot', { method: 'POST', body: { email } });
}

/** Sets a new password from an emailed reset link and signs this device in. */
export async function resetPassword({ token, password }) {
  const { user } = await apiRequest('/auth/reset', { method: 'POST', body: { token, password } });
  return user;
}

/**
 * @returns {Promise<object|null>} The session's user, or null when there is no valid session.
 * Throws an ApiError with `network: true` when the server can't be reached.
 */
export async function fetchCurrentUser() {
  const { user } = await apiRequest('/auth/me');
  return user ?? null;
}

export async function endServerSession() {
  await apiRequest('/auth/signout', { method: 'POST' });
}
