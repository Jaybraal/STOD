import { useEffect, useState } from 'react';
import type { SyncState } from '../db/sync';
import { getSyncState, onSyncStateChange } from '../db/sync';

export function useSyncStatus() {
  const [state, setState] = useState<SyncState>(getSyncState());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const unsubscribe = onSyncStateChange(setState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { ...state, isOnline };
}
