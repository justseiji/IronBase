import { useState, useEffect } from 'react';
import { syncState } from '../../../services/syncEngine';

export default function SyncStatusIndicator() {
  const [status, setStatus] = useState(syncState.status);

  useEffect(() => {
    const unsubscribe = syncState.subscribe(setStatus);
    return unsubscribe;
  }, []);

  const getStatusDisplay = () => {
    switch (status) {
      case 'syncing': return { text: 'Syncing...', color: '#63b3ed' };
      case 'offline': return { text: 'Offline', color: '#fc8181' };
      case 'error': return { text: 'Sync Error', color: '#e53e3e' };
      case 'idle':
      default: return { text: 'Synced', color: '#68d391' };
    }
  };

  const display = getStatusDisplay();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a0aec0' }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: display.color,
        transition: 'background-color 0.3s ease'
      }} />
      <span>{display.text}</span>
    </div>
  );
}
