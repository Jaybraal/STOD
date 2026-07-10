import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateId, now } from '../index';
import type { ClinicalDocument } from '../schemas';

const col = (clinicId: string) => `clinics/${clinicId}/clinicalDocuments`;

export async function getClinicalDocument(clinicId: string, id: string): Promise<ClinicalDocument> {
  const snap = await getDoc(doc(db, col(clinicId), id));
  if (!snap.exists()) throw new Error('Documento no encontrado');
  return { _id: snap.id, ...snap.data() } as ClinicalDocument;
}

export async function createClinicalDocument(
  clinicId: string,
  data: Omit<ClinicalDocument, '_id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
): Promise<ClinicalDocument> {
  const timestamp = now();
  const id = generateId('doc');
  const docData = { createdAt: timestamp, updatedAt: timestamp, deletedAt: null, ...data };
  await setDoc(doc(db, col(clinicId), id), docData);
  return { _id: id, ...docData };
}

export async function updateClinicalDocument(
  clinicId: string,
  id: string,
  data: Partial<ClinicalDocument>
): Promise<void> {
  const { _id: _, ...updates } = { ...data, updatedAt: now() };
  void _;
  await updateDoc(doc(db, col(clinicId), id), updates as Record<string, unknown>);
}

export async function deleteClinicalDocument(clinicId: string, id: string): Promise<void> {
  await updateDoc(doc(db, col(clinicId), id), { deletedAt: now(), updatedAt: now() });
}
