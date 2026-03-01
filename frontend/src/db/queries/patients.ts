import { db, generateId, now } from '../index';
import type { Patient } from '../schemas';

export async function getAllPatients(): Promise<Patient[]> {
  const result = await db.find({
    selector: { type: 'patient', deletedAt: { $exists: false } },
    sort: [{ type: 'asc' }],
  });
  const patients = result.docs as unknown as Patient[];
  return patients.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export async function getPatient(id: string): Promise<Patient> {
  return db.get(id) as unknown as Patient;
}

export async function createPatient(data: Omit<Patient, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
  const timestamp = now();
  const doc: Patient = {
    _id: generateId('patient'),
    type: 'patient',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...data,
  };
  await db.put(doc);
  return doc;
}

export async function updatePatient(id: string, data: Partial<Patient>): Promise<Patient> {
  const existing = await db.get(id) as unknown as Patient;
  const updated: Patient = { ...existing, ...data, updatedAt: now() };
  await db.put(updated);
  return updated;
}

export async function deletePatient(id: string): Promise<void> {
  const doc = await db.get(id) as unknown as Patient;
  await db.put({ ...doc, deletedAt: now(), updatedAt: now() });
}

export async function searchPatients(query: string): Promise<Patient[]> {
  const all = await getAllPatients();
  const q = query.toLowerCase();
  return all.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.email.toLowerCase().includes(q)
  );
}
