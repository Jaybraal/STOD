import axios from 'axios';

const COUCHDB_URL = process.env.COUCHDB_URL!;
const ADMIN_USER = process.env.COUCHDB_ADMIN_USER!;
const ADMIN_PASS = process.env.COUCHDB_ADMIN_PASS!;

const couch = axios.create({
  baseURL: COUCHDB_URL,
  auth: { username: ADMIN_USER, password: ADMIN_PASS },
  headers: { 'Content-Type': 'application/json' },
});

export async function createDatabase(dbName: string): Promise<void> {
  await couch.put(`/${dbName}`);
}

export async function databaseExists(dbName: string): Promise<boolean> {
  try {
    await couch.head(`/${dbName}`);
    return true;
  } catch {
    return false;
  }
}

export async function createUser(username: string, password: string): Promise<void> {
  await couch.put(`/_users/org.couchdb.user:${username}`, {
    name: username,
    password,
    roles: [],
    type: 'user',
  });
}

export async function setDatabaseSecurity(dbName: string, username: string): Promise<void> {
  await couch.put(`/${dbName}/_security`, {
    admins: { names: [], roles: [] },
    members: { names: [username], roles: [] },
  });
}

// Guarda el mapeo code → credenciales en un doc _local de una DB maestra
const REGISTRY_DB = 'stod_registry';

export async function ensureRegistryDB(): Promise<void> {
  const exists = await databaseExists(REGISTRY_DB);
  if (!exists) {
    await createDatabase(REGISTRY_DB);
  }
}

export interface CodeRecord {
  code: string;
  dbName: string;
  syncUrl: string;
  username: string;
  password: string;
  createdAt: string;
}

export async function saveCodeRecord(record: CodeRecord): Promise<void> {
  await ensureRegistryDB();
  try {
    await couch.put(`/${REGISTRY_DB}/${record.code}`, record);
  } catch (err: unknown) {
    // Si ya existe, actualizar
    if (axios.isAxiosError(err) && err.response?.status === 409) {
      const existing = await couch.get(`/${REGISTRY_DB}/${record.code}`);
      await couch.put(`/${REGISTRY_DB}/${record.code}`, { ...record, _rev: existing.data._rev });
    } else throw err;
  }
}

export async function getCodeRecord(code: string): Promise<CodeRecord | null> {
  try {
    const res = await couch.get(`/${REGISTRY_DB}/${code}`);
    return res.data as CodeRecord;
  } catch {
    return null;
  }
}
