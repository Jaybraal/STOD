import { db, generateId, now } from '../index';
import type { Prescription } from '../schemas';

export async function getPrescriptionsForPatient(patientId: string): Promise<Prescription[]> {
  const result = await db.find({
    selector: { type: 'prescription', patientId, deletedAt: { $exists: false } },
  });
  const prescriptions = result.docs as unknown as Prescription[];
  return prescriptions.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPrescription(id: string): Promise<Prescription> {
  return db.get(id) as unknown as Prescription;
}

export async function getAllPrescriptions(): Promise<Prescription[]> {
  const result = await db.find({
    selector: { type: 'prescription', deletedAt: { $exists: false } },
  });
  const prescriptions = result.docs as unknown as Prescription[];
  return prescriptions.sort((a, b) => b.date.localeCompare(a.date));
}

export async function createPrescription(
  data: Omit<Prescription, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>
): Promise<Prescription> {
  const timestamp = now();
  const doc: Prescription = {
    _id: generateId('prescription'),
    type: 'prescription',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...data,
  };
  await db.put(doc);
  return doc;
}

export async function updatePrescription(id: string, data: Partial<Prescription>): Promise<Prescription> {
  const existing = await db.get(id) as unknown as Prescription;
  const updated: Prescription = { ...existing, ...data, updatedAt: now() };
  await db.put(updated);
  return updated;
}

export async function deletePrescription(id: string): Promise<void> {
  const doc = await db.get(id) as unknown as Prescription;
  await db.put({ ...doc, deletedAt: now(), updatedAt: now() });
}
