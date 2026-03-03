import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateId, now } from '../index';
import type { Patient } from '../schemas';

const col = (clinicId: string) => `clinics/${clinicId}/patients`;

export async function getPatient(clinicId: string, id: string): Promise<Patient> {
  const snap = await getDoc(doc(db, col(clinicId), id));
  if (!snap.exists()) throw new Error('Paciente no encontrado');
  return { _id: snap.id, ...snap.data() } as Patient;
}

export async function createPatient(
  clinicId: string,
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
  await setDoc(doc(db, col(clinicId), id), { ...rest, deletedAt: null });
  return { _id: id, ...rest, deletedAt: null };
}

export async function updatePatient(clinicId: string, id: string, data: Partial<Patient>): Promise<void> {
  const { _id: _, ...updates } = { ...data, updatedAt: now() };
  void _;
  await updateDoc(doc(db, col(clinicId), id), updates as Record<string, unknown>);
}

export async function deletePatient(clinicId: string, id: string): Promise<void> {
  await updateDoc(doc(db, col(clinicId), id), { deletedAt: now(), updatedAt: now() });
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
