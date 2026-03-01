import { db, now } from '../index';
import type { ClinicConfig } from '../schemas';

const CONFIG_ID = 'config_clinic';

const DEFAULT_CONFIG: ClinicConfig = {
  _id: CONFIG_ID,
  type: 'config',
  createdAt: now(),
  updatedAt: now(),
  clinicName: '',
  doctorName: '',
  phone: '',
  address: '',
  syncCode: null,
  syncUrl: null,
  syncUsername: null,
  syncPassword: null,
};

export async function getConfig(): Promise<ClinicConfig> {
  try {
    return await db.get(CONFIG_ID) as unknown as ClinicConfig;
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) {
      // Primera vez: crear config por defecto
      await db.put(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
    throw err;
  }
}

export async function updateConfig(data: Partial<ClinicConfig>): Promise<ClinicConfig> {
  const existing = await getConfig();
  const updated: ClinicConfig = { ...existing, ...data, updatedAt: now() };
  await db.put(updated);
  return updated;
}

export async function saveSyncCredentials(
  code: string,
  syncUrl: string,
  syncUsername: string,
  syncPassword: string
): Promise<ClinicConfig> {
  return updateConfig({ syncCode: code, syncUrl, syncUsername, syncPassword });
}

export async function clearSyncCredentials(): Promise<ClinicConfig> {
  return updateConfig({ syncCode: null, syncUrl: null, syncUsername: null, syncPassword: null });
}
