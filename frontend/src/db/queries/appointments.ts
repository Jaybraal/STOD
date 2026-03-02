import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { generateId, now } from '../index';
import type { Appointment, AppointmentStatus } from '../schemas';

const COL = 'appointments';

export async function getAppointment(id: string): Promise<Appointment> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) throw new Error('Cita no encontrada');
  return { _id: snap.id, ...snap.data() } as Appointment;
}

export async function getAppointmentsInRange(startDate: string, endDate: string): Promise<Appointment[]> {
  const q = query(
    collection(db, COL),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ _id: d.id, ...d.data() }) as Appointment)
    .filter(a => a.deletedAt === null);
}

export async function createAppointment(
  data: Omit<Appointment, '_id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
): Promise<Appointment> {
  const timestamp = now();
  const id = generateId('appointment');
  const docData = { createdAt: timestamp, updatedAt: timestamp, deletedAt: null, ...data };
  await setDoc(doc(db, COL, id), docData);
  return { _id: id, ...docData };
}

export async function updateAppointment(id: string, data: Partial<Appointment>): Promise<void> {
  const { _id: _, ...updates } = { ...data, updatedAt: now() };
  void _;
  await updateDoc(doc(db, COL, id), updates as Record<string, unknown>);
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
  await updateDoc(doc(db, COL, id), { status, updatedAt: now() });
}

export async function deleteAppointment(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), { deletedAt: now(), updatedAt: now() });
}
