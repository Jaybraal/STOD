import { db, generateId, now } from '../index';
import type { Treatment, TreatmentStatus } from '../schemas';

export async function getTreatmentsForPatient(patientId: string): Promise<Treatment[]> {
  const result = await db.find({
    selector: { type: 'treatment', patientId, deletedAt: { $exists: false } },
  });
  const treatments = result.docs as unknown as Treatment[];
  return treatments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAllTreatments(): Promise<Treatment[]> {
  const result = await db.find({
    selector: { type: 'treatment', deletedAt: { $exists: false } },
  });
  return result.docs as unknown as Treatment[];
}

export async function getTreatment(id: string): Promise<Treatment> {
  return db.get(id) as unknown as Treatment;
}

export async function createTreatment(
  data: Omit<Treatment, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>
): Promise<Treatment> {
  const timestamp = now();
  const doc: Treatment = {
    _id: generateId('treatment'),
    type: 'treatment',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...data,
  };
  await db.put(doc);
  return doc;
}

export async function updateTreatment(id: string, data: Partial<Treatment>): Promise<Treatment> {
  const existing = await db.get(id) as unknown as Treatment;
  const updated: Treatment = { ...existing, ...data, updatedAt: now() };
  await db.put(updated);
  return updated;
}

export async function updateTreatmentStatus(id: string, status: TreatmentStatus): Promise<void> {
  const doc = await db.get(id) as unknown as Treatment;
  await db.put({ ...doc, status, updatedAt: now() });
}

export async function deleteTreatment(id: string): Promise<void> {
  const doc = await db.get(id) as unknown as Treatment;
  await db.put({ ...doc, deletedAt: now(), updatedAt: now() });
}

export async function getTreatmentCostSummary(patientId: string): Promise<{ total: number; completado: number; pendiente: number }> {
  const treatments = await getTreatmentsForPatient(patientId);
  const total = treatments.reduce((sum, t) => sum + (t.cost || 0), 0);
  const completado = treatments
    .filter((t) => t.status === 'completado')
    .reduce((sum, t) => sum + (t.cost || 0), 0);
  return { total, completado, pendiente: total - completado };
}
