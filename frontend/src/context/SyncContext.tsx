import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface SyncContextValue {
  isOnline: boolean;
}

const SyncContext = createContext<SyncContextValue>({ isOnline: true });

export function SyncProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return (
    <SyncContext.Provider value={{ isOnline }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext() {
  return useContext(SyncContext);
}
