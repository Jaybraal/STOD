import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateId, now } from '../index';
import type { Prescription } from '../schemas';

const COL = 'prescriptions';

export async function getPrescription(id: string): Promise<Prescription> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) throw new Error('Receta no encontrada');
  return { _id: snap.id, ...snap.data() } as Prescription;
}

export async function createPrescription(
  data: Omit<Prescription, '_id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
): Promise<Prescription> {
  const timestamp = now();
  const id = generateId('prescription');
  const docData = { createdAt: timestamp, updatedAt: timestamp, deletedAt: null, ...data };
  await setDoc(doc(db, COL, id), docData);
  return { _id: id, ...docData };
}

export async function updatePrescription(id: string, data: Partial<Prescription>): Promise<void> {
  const { _id: _, ...updates } = { ...data, updatedAt: now() };
  void _;
  await updateDoc(doc(db, COL, id), updates as Record<string, unknown>);
}

export async function deletePrescription(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), { deletedAt: now(), updatedAt: now() });
}
