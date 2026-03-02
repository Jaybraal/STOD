import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateId, now } from '../index';
import type { Patient } from '../schemas';

const COL = 'patients';

export async function getPatient(id: string): Promise<Patient> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) throw new Error('Paciente no encontrado');
  return { _id: snap.id, ...snap.data() } as Patient;
}

export async function createPatient(
  data: Omit<Patient, '_id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
): Promise<Patient> {
  const timestamp = now();
  const id = generateId('patient');
  const { _id: _, ...rest } = {
    _id: id,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    ...data,
  } as Patient & { _id: string };
  void _;
  await setDoc(doc(db, COL, id), { ...rest, deletedAt: null });
  return { _id: id, ...rest, deletedAt: null };
}

export async function updatePatient(id: string, data: Partial<Patient>): Promise<void> {
  const { _id: _, ...updates } = { ...data, updatedAt: now() };
  void _;
  await updateDoc(doc(db, COL, id), updates as Record<string, unknown>);
}

export async function deletePatient(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), { deletedAt: now(), updatedAt: now() });
}

export async function searchPatients(query: string, patients: Patient[]): Promise<Patient[]> {
  const q = query.toLowerCase();
  return patients.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.email.toLowerCase().includes(q)
  );
}
