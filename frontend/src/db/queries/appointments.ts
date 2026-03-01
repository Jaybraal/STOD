import { db, generateId, now } from '../index';
import type { Appointment, AppointmentStatus } from '../schemas';

export async function getAppointmentsForDate(date: string): Promise<Appointment[]> {
  const result = await db.find({
    selector: { type: 'appointment', date, deletedAt: { $exists: false } },
  });
  const appointments = result.docs as unknown as Appointment[];
  return appointments.sort((a, b) => a.time.localeCompare(b.time));
}

export async function getAppointmentsForPatient(patientId: string): Promise<Appointment[]> {
  const result = await db.find({
    selector: { type: 'appointment', patientId, deletedAt: { $exists: false } },
  });
  const appointments = result.docs as unknown as Appointment[];
  return appointments.sort((a, b) => {
    const dateA = `${a.date} ${a.time}`;
    const dateB = `${b.date} ${b.time}`;
    return dateB.localeCompare(dateA); // más reciente primero
  });
}

export async function getAppointmentsInRange(startDate: string, endDate: string): Promise<Appointment[]> {
  const result = await db.find({
    selector: {
      type: 'appointment',
      date: { $gte: startDate, $lte: endDate },
      deletedAt: { $exists: false },
    },
  });
  return result.docs as unknown as Appointment[];
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const result = await db.find({
    selector: { type: 'appointment', deletedAt: { $exists: false } },
  });
  return result.docs as unknown as Appointment[];
}

export async function getAppointment(id: string): Promise<Appointment> {
  return db.get(id) as unknown as Appointment;
}

export async function createAppointment(
  data: Omit<Appointment, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>
): Promise<Appointment> {
  const timestamp = now();
  const doc: Appointment = {
    _id: generateId('appointment'),
    type: 'appointment',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...data,
  };
  await db.put(doc);
  return doc;
}

export async function updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment> {
  const existing = await db.get(id) as unknown as Appointment;
  const updated: Appointment = { ...existing, ...data, updatedAt: now() };
  await db.put(updated);
  return updated;
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
  const doc = await db.get(id) as unknown as Appointment;
  await db.put({ ...doc, status, updatedAt: now() });
}

export async function deleteAppointment(id: string): Promise<void> {
  const doc = await db.get(id) as unknown as Appointment;
  await db.put({ ...doc, deletedAt: now(), updatedAt: now() });
}
