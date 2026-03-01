import PouchDB from 'pouchdb-browser';
import { db } from './index';

export type SyncStatus = 'disconnected' | 'connecting' | 'active' | 'paused' | 'error';

export interface SyncState {
  status: SyncStatus;
  lastSync: Date | null;
  error: string | null;
}

type SyncHandler = PouchDB.Replication.Sync<Record<string, unknown>>;

let syncHandler: SyncHandler | null = null;
let statusListeners: Array<(state: SyncState) => void> = [];
let currentState: SyncState = { status: 'disconnected', lastSync: null, error: null };

function notifyListeners(state: SyncState) {
  currentState = state;
  statusListeners.forEach((fn) => fn(state));
}

export function getSyncState(): SyncState {
  return currentState;
}

export function onSyncStateChange(fn: (state: SyncState) => void): () => void {
  statusListeners.push(fn);
  fn(currentState); // emitir estado actual inmediatamente
  return () => {
    statusListeners = statusListeners.filter((l) => l !== fn);
  };
}

export function startSync(remoteUrl: string, username: string, password: string): void {
  if (syncHandler) {
    syncHandler.cancel();
    syncHandler = null;
  }

  notifyListeners({ status: 'connecting', lastSync: currentState.lastSync, error: null });

  const remoteDB = new PouchDB(remoteUrl, {
    auth: { username, password },
    skip_setup: true,
  });

  syncHandler = db.sync(remoteDB as PouchDB.Database<Record<string, unknown>>, {
    live: true,
    retry: true,
    back_off_function: (delay: number) => {
      return delay === 0 ? 1000 : Math.min(delay * 2, 60000);
    },
  });

  syncHandler
    .on('change', () => {
      notifyListeners({ status: 'active', lastSync: new Date(), error: null });
    })
    .on('paused', () => {
      notifyListeners({ status: 'paused', lastSync: currentState.lastSync, error: null });
    })
    .on('active', () => {
      notifyListeners({ status: 'active', lastSync: currentState.lastSync, error: null });
    })
    .on('error', (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Error de sincronización';
      notifyListeners({ status: 'error', lastSync: currentState.lastSync, error: message });
    });

  // Resolver conflictos automáticamente (last-write-wins por updatedAt)
  db.changes({ live: true, since: 'now', include_docs: true, conflicts: true })
    .on('change', async (change) => {
      if (change.doc?._conflicts?.length) {
        await resolveConflict(change.id, change.doc as unknown as Record<string, unknown>);
      }
    });
}

export function stopSync(): void {
  if (syncHandler) {
    syncHandler.cancel();
    syncHandler = null;
  }
  notifyListeners({ status: 'disconnected', lastSync: currentState.lastSync, error: null });
}

async function resolveConflict(docId: string, winnerDoc: Record<string, unknown>): Promise<void> {
  const conflicts = winnerDoc._conflicts as string[];
  if (!conflicts?.length) return;

  for (const rev of conflicts) {
    try {
      const conflictDoc = await db.get(docId, { rev }) as Record<string, unknown>;
      // Mantener el más reciente por updatedAt
      if ((conflictDoc.updatedAt as string) > (winnerDoc.updatedAt as string)) {
        await db.put({ ...conflictDoc, _rev: winnerDoc._rev as string });
      }
      // Eliminar la revisión perdedora
      await db.remove(docId, rev);
    } catch (err) {
      console.error('[Sync] Error resolviendo conflicto:', err);
    }
  }
}
