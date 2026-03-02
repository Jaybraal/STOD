import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateId, now } from '../index';
import type { Treatment, TreatmentStatus } from '../schemas';

const COL = 'treatments';

export async function getTreatment(id: string): Promise<Treatment> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) throw new Error('Tratamiento no encontrado');
  return { _id: snap.id, ...snap.data() } as Treatment;
}

export async function createTreatment(
  data: Omit<Treatment, '_id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
): Promise<Treatment> {
  const timestamp = now();
  const id = generateId('treatment');
  const docData = { createdAt: timestamp, updatedAt: timestamp, deletedAt: null, ...data };
  await setDoc(doc(db, COL, id), docData);
  return { _id: id, ...docData };
}

export async function updateTreatment(id: string, data: Partial<Treatment>): Promise<void> {
  const { _id: _, ...updates } = { ...data, updatedAt: now() };
  void _;
  await updateDoc(doc(db, COL, id), updates as Record<string, unknown>);
}

export async function updateTreatmentStatus(id: string, status: TreatmentStatus): Promise<void> {
  await updateDoc(doc(db, COL, id), { status, updatedAt: now() });
}

export async function deleteTreatment(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), { deletedAt: now(), updatedAt: now() });
}

export function getTreatmentCostSummary(treatments: Treatment[]): { total: number; completado: number; pendiente: number } {
  const total = treatments.reduce((sum, t) => sum + (t.cost || 0), 0);
  const completado = treatments
    .filter((t) => t.status === 'completado')
    .reduce((sum, t) => sum + (t.cost || 0), 0);
  return { total, completado, pendiente: total - completado };
}
