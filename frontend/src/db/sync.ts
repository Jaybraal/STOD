// Con Firebase Firestore, el sync es automático.
// Este módulo solo expone el estado de conexión a internet.

export type SyncStatus = 'online' | 'offline';

export interface SyncState {
  status: SyncStatus;
}

export function getSyncState(): SyncState {
  return { status: navigator.onLine ? 'online' : 'offline' };
}
