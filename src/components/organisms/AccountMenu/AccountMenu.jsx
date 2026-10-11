import { useEffect, useId, useRef, useState } from 'react';
import Button from '../../atoms/Button/Button';
import TextInput from '../../atoms/TextInput/TextInput';
import { useAuth } from '../../../auth/useAuth';
import useSyncStatus from '../../../hooks/useSyncStatus';
import styles from './AccountMenu.module.css';

const IDLE_DELETE = { step: 'idle', password: '', error: null }; // idle | confirm | deleting

function syncDetail({ status, pending, lastSyncedAt }) {
  const changes = `${pending} change${pending !== 1 ? 's' : ''}`;
  if (status === 'offline') return pending > 0 ? `Offline · ${changes} saved on this device` : 'Offline · Your data is available on this device';
  if (status === 'error') return 'Some changes couldn’t sync. IronBase will keep retrying.';
  if (status === 'syncing') return pending > 0 ? `Syncing ${changes}…` : 'Syncing…';
  if (!lastSyncedAt) return 'Up to date';
  const seconds = Math.round((Date.now() - lastSyncedAt.getTime()) / 1000);
  if (seconds < 60) return 'All changes synced · just now';
  const minutes = Math.round(seconds / 60);
  return `All changes synced · ${minutes} min ago`;
}

export default function AccountMenu() {
  const { user, prepareSignOut, signOut, deleteAccount } = useAuth();
  const sync = useSyncStatus();
  const [open, setOpen] = useState(false);
  const [signOutState, setSignOutState] = useState({ step: 'idle', unsynced: 0 }); // idle | checking | confirm | leaving
  const [deleteState, setDeleteState] = useState(IDLE_DELETE);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const panelId = useId();
  const passwordId = useId();

  function close({ restoreFocus = true } = {}) {
    setOpen(false);
    setSignOutState(s => (s.step === 'leaving' ? s : { step: 'idle', unsynced: 0 }));
    setDeleteState(s => (s.step === 'deleting' ? s : IDLE_DELETE));
    if (restoreFocus) triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    function onPointer(e) {
      if (!panelRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) close({ restoreFocus: false });
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  async function handleSignOut() {
    setSignOutState({ step: 'checking', unsynced: 0 });
    let unsynced = 0;
    try {
      unsynced = await prepareSignOut();
    } catch {
      unsynced = 0;
    }
    if (unsynced > 0) {
      setSignOutState({ step: 'confirm', unsynced });
      return;
    }
    setSignOutState({ step: 'leaving', unsynced: 0 });
    await signOut({ keepLocalData: false });
  }

  async function confirmSignOut() {
    setSignOutState(s => ({ ...s, step: 'leaving' }));
    await signOut({ keepLocalData: true });
  }

  async function confirmDelete(e) {
    e.preventDefault();
    if (deleteState.step === 'deleting') return;
    if (!deleteState.password) {
      setDeleteState(s => ({ ...s, error: 'Enter your password.' }));
      return;
    }
    setDeleteState(s => ({ ...s, step: 'deleting', error: null }));
    try {
      await deleteAccount(deleteState.password);
    } catch (err) {
      setDeleteState(s => ({ ...s, step: 'confirm', error: err.message }));
    }
  }

  const initial = (user.username || user.email || '?').charAt(0).toUpperCase();
  const busy = signOutState.step === 'checking' || signOutState.step === 'leaving';

  return (
    <div className={styles.wrapper}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => (open ? close() : setOpen(true))}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Account: ${user.username}`}
      >
        <span className={styles.avatar} aria-hidden="true">{initial}</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          className={styles.panel}
          role="dialog"
          aria-label="Account"
          tabIndex={-1}
        >
          <div className={styles.identity}>
            <span className={`${styles.avatar} ${styles.avatarLarge}`} aria-hidden="true">{initial}</span>
            <div className={styles.identityText}>
              <span className={styles.username}>{user.username}</span>
              <span className={styles.email}>{user.email}</span>
            </div>
          </div>

          <p className={styles.sync}>
            <span className={`${styles.syncDot} ${styles[sync.status]}`} aria-hidden="true" />
            {syncDetail(sync)}
          </p>

          {signOutState.step === 'confirm' ? (
            <div className={styles.confirm}>
              <p className={styles.confirmText}>
                {signOutState.unsynced} change{signOutState.unsynced !== 1 ? 's haven’t' : ' hasn’t'} synced yet.
                {' '}They’ll stay on this device and sync the next time you sign in here.
              </p>
              <div className={styles.confirmActions}>
                <Button variant="secondary" onClick={() => setSignOutState({ step: 'idle', unsynced: 0 })}>Cancel</Button>
                <Button variant="danger" onClick={confirmSignOut}>Sign Out</Button>
              </div>
            </div>
          ) : deleteState.step !== 'idle' ? (
            <form className={styles.confirm} onSubmit={confirmDelete} noValidate>
              <p className={styles.confirmText}>
                This permanently deletes your account, your workouts and every logged set, on the server and on this device.
                {' '}It can’t be undone.
              </p>
              <TextInput
                id={passwordId}
                label="Password"
                type="password"
                autoComplete="current-password"
                value={deleteState.password}
                onChange={e => setDeleteState(s => ({ ...s, password: e.target.value, error: null }))}
              />
              {deleteState.error && <p className={styles.deleteError} role="alert">{deleteState.error}</p>}
              <div className={styles.confirmActions}>
                <Button variant="secondary" onClick={() => setDeleteState(IDLE_DELETE)} disabled={deleteState.step === 'deleting'}>Cancel</Button>
                <Button type="submit" variant="danger" status={deleteState.step === 'deleting' ? 'loading' : 'idle'}>Delete</Button>
              </div>
            </form>
          ) : (
            <Button variant="secondary" fullWidth onClick={handleSignOut} status={busy ? 'loading' : 'idle'}>
              Sign Out
            </Button>
          )}

          {signOutState.step === 'idle' && deleteState.step === 'idle' && (
            <div className={styles.privacy}>
              <p>IronBase stores your email, username, a hashed password and your workouts. Nothing else.</p>
              <button type="button" className={styles.deleteLink} onClick={() => setDeleteState({ ...IDLE_DELETE, step: 'confirm' })}>
                Delete account
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
