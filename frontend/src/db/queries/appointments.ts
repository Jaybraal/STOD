import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { generateId, now } from '../index';
import type { Appointment, AppointmentStatus } from '../schemas';

const col = (clinicId: string) => `clinics/${clinicId}/appointments`;

export async function getAppointment(clinicId: string, id: string): Promise<Appointment> {
  const snap = await getDoc(doc(db, col(clinicId), id));
  if (!snap.exists()) throw new Error('Cita no encontrada');
  return { _id: snap.id, ...snap.data() } as Appointment;
}

export async function getAppointmentsInRange(clinicId: string, startDate: string, endDate: string): Promise<Appointment[]> {
  const q = query(
    collection(db, col(clinicId)),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    where('deletedAt', '==', null)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ _id: d.id, ...d.data() }) as Appointment);
}

export async function createAppointment(
  clinicId: string,
  data: Omit<Appointment, '_id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
): Promise<Appointment> {
  const timestamp = now();
  const id = generateId('appointment');
  const docData = { createdAt: timestamp, updatedAt: timestamp, deletedAt: null, ...data };
  await setDoc(doc(db, col(clinicId), id), docData);
  return { _id: id, ...docData };
}

export async function updateAppointment(clinicId: string, id: string, data: Partial<Appointment>): Promise<void> {
  const { _id: _, ...updates } = { ...data, updatedAt: now() };
  void _;
  await updateDoc(doc(db, col(clinicId), id), updates as Record<string, unknown>);
}

export async function updateAppointmentStatus(clinicId: string, id: string, status: AppointmentStatus): Promise<void> {
  await updateDoc(doc(db, col(clinicId), id), { status, updatedAt: now() });
}

export async function deleteAppointment(clinicId: string, id: string): Promise<void> {
  await updateDoc(doc(db, col(clinicId), id), { deletedAt: now(), updatedAt: now() });
}
