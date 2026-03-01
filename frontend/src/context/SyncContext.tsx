import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { startSync, stopSync } from '../db/sync';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useConfig } from '../hooks/useConfig';

interface SyncContextValue {
  isOnline: boolean;
  status: string;
  lastSync: Date | null;
  error: string | null;
}

const SyncContext = createContext<SyncContextValue>({
  isOnline: true,
  status: 'disconnected',
  lastSync: null,
  error: null,
});

export function SyncProvider({ children }: { children: ReactNode }) {
  const { config } = useConfig();
  const syncState = useSyncStatus();

  // Iniciar sync automáticamente si hay credenciales guardadas
  useEffect(() => {
    if (config?.syncUrl && config?.syncUsername && config?.syncPassword) {
      startSync(config.syncUrl, config.syncUsername, config.syncPassword);
    } else {
      stopSync();
    }
  }, [config?.syncUrl, config?.syncUsername, config?.syncPassword]);

  return (
    <SyncContext.Provider
      value={{
        isOnline: syncState.isOnline,
        status: syncState.status,
        lastSync: syncState.lastSync,
        error: syncState.error,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext() {
  return useContext(SyncContext);
}
