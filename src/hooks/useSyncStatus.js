import { useEffect, useState } from 'react';
import { syncState } from '../services/syncEngine';

// Routine background pulls finish quickly; only surface "Syncing…" when a
// cycle is noticeably long or local changes are actually being pushed.
const SYNCING_DELAY_MS = 600;

export default function useSyncStatus() {
  const [state, setState] = useState(() => syncState.snapshot());
  const [slowCycle, setSlowCycle] = useState(null);

  useEffect(() => syncState.subscribe(setState), []);

  const cycleKey = state.status === 'syncing' ? state : null;
  useEffect(() => {
    if (!cycleKey) return;
    const timer = setTimeout(() => setSlowCycle(cycleKey), SYNCING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [cycleKey]);

  const hideSyncing = state.status === 'syncing' && state.pending === 0 && slowCycle !== cycleKey;
  return { ...state, status: hideSyncing ? 'synced' : state.status };
}

export const SYNC_LABELS = {
  synced: 'Synced',
  syncing: 'Syncing…',
  offline: 'Offline',
  error: 'Sync error',
};
