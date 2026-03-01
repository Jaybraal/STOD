import PouchDB from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
PouchDB.plugin((PouchDBFind as any).default ?? PouchDBFind);

// Instancia local única
export const db = new PouchDB('stod_local');
// Cada hook abre su propio feed changes() — aumentar límite para evitar warning
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(db as any).setMaxListeners?.(50);

// Crear índices necesarios para consultas eficientes
export async function initializeDB(): Promise<void> {
  try {
    await db.createIndex({ index: { fields: ['type'] } });
    await db.createIndex({ index: { fields: ['type', 'patientId'] } });
    await db.createIndex({ index: { fields: ['type', 'date'] } });
    await db.createIndex({ index: { fields: ['type', 'status'] } });
    await db.createIndex({ index: { fields: ['type', 'updatedAt'] } });
    await db.createIndex({ index: { fields: ['type', 'deletedAt'] } });
    console.log('[DB] Índices creados correctamente');
  } catch (err) {
    console.error('[DB] Error creando índices:', err);
  }
}

// Helper: timestamp ISO actual
export function now(): string {
  return new Date().toISOString();
}

// Helper: generar ID con prefijo
export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
