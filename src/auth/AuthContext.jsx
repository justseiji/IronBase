import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './useAuth';
import {
  getStoredAccount, storeAccount, clearStoredAccount,
  signIn as apiSignIn, signUp as apiSignUp, resetPassword as apiResetPassword,
  fetchCurrentUser, endServerSession,
} from '../services/authService';

const AUTHENTICATORS = { signUp: apiSignUp, signIn: apiSignIn, reset: apiResetPassword };
import { stopSyncEngine, syncNow } from '../services/syncEngine';
import { closeDb, deleteUserDb } from '../database/db';
import { getUnsyncedCount } from '../repositories/workoutRepository';
import { draftKeyFor } from '../utils/drafts';

// Set when sign-out couldn't reach the server, so the still-valid session
// cookie is revoked before this device is trusted again.
const PENDING_SIGNOUT_KEY = 'ironbase-pending-signout';

const EXPIRED_NOTICE = 'Your session ended. Sign in again to keep syncing.';

function readFlag(key) {
  try { return localStorage.getItem(key) === '1'; } catch { return false; }
}

function writeFlag(key, on) {
  try {
    if (on) localStorage.setItem(key, '1');
    else localStorage.removeItem(key);
  } catch {
    // Storage unavailable; nothing to persist.
  }
}

function initialState() {
  if (readFlag(PENDING_SIGNOUT_KEY)) return { status: 'signedOut', user: null, notice: null };
  const stored = getStoredAccount();
  // A device that has signed in before opens straight into its local data,
  // which keeps IronBase usable offline; the session is verified in the background.
  return stored
    ? { status: 'signedIn', user: stored, notice: null }
    : { status: 'checking', user: null, notice: null };
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(initialState);

  const expire = useCallback(async () => {
    stopSyncEngine();
    await closeDb();
    clearStoredAccount();
    setState({ status: 'signedOut', user: null, notice: EXPIRED_NOTICE });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (readFlag(PENDING_SIGNOUT_KEY)) {
        try {
          await endServerSession();
          writeFlag(PENDING_SIGNOUT_KEY, false);
        } catch {
          // Still offline; try again next launch.
        }
        return;
      }
      try {
        const user = await fetchCurrentUser();
        if (cancelled) return;
        if (user) {
          storeAccount(user);
          setState(s => (s.user?.id === user.id && s.user.username === user.username && s.user.email === user.email)
            ? s
            : { status: 'signedIn', user, notice: null });
        } else if (getStoredAccount()) {
          expire();
        } else {
          setState({ status: 'signedOut', user: null, notice: null });
        }
      } catch {
        if (cancelled) return;
        // Offline: a known device keeps working locally; a new one must wait for a connection.
        setState(s => (s.status === 'checking' ? { status: 'signedOut', user: null, notice: null } : s));
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [expire]);

  useEffect(() => {
    const onUnauthorized = () => expire();
    window.addEventListener('ironbase-unauthorized', onUnauthorized);
    return () => window.removeEventListener('ironbase-unauthorized', onUnauthorized);
  }, [expire]);

  /** Authenticate with the server. Resolves with the user; call `enter` to open the app. */
  const authenticate = useCallback(async (mode, fields) => {
    const user = await AUTHENTICATORS[mode](fields);
    writeFlag(PENDING_SIGNOUT_KEY, false);
    storeAccount(user);
    return user;
  }, []);

  const enter = useCallback((user) => {
    setState({ status: 'signedIn', user, notice: null });
  }, []);

  /**
   * Push outstanding changes, then report how many are still unsynced so the
   * caller can confirm before anything local is left behind.
   */
  const prepareSignOut = useCallback(async () => {
    await syncNow();
    return getUnsyncedCount();
  }, []);

  /**
   * @param {{ keepLocalData: boolean }} options - keep this account's local
   * database on the device (needed when changes haven't synced yet).
   */
  const signOut = useCallback(async ({ keepLocalData }) => {
    const user = state.user;
    stopSyncEngine();
    try {
      await endServerSession();
    } catch {
      writeFlag(PENDING_SIGNOUT_KEY, true);
    }
    if (user) {
      if (keepLocalData) {
        await closeDb();
      } else {
        await deleteUserDb(user.id);
        try { localStorage.removeItem(draftKeyFor(user.id)); } catch { /* ignore */ }
      }
    }
    clearStoredAccount();
    setState({ status: 'signedOut', user: null, notice: null });
  }, [state.user]);

  const value = useMemo(() => ({
    ...state, authenticate, enter, prepareSignOut, signOut,
  }), [state, authenticate, enter, prepareSignOut, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
