import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../db/firebase';
import type { Appointment } from '../db/schemas';
import * as q from '../db/queries/appointments';

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fsQuery = query(collection(db, 'appointments'), where('deletedAt', '==', null));
    const unsub = onSnapshot(fsQuery, (snap) => {
      setAppointments(snap.docs.map(d => ({ _id: d.id, ...d.data() }) as Appointment));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { appointments, loading };
}

export function useAppointmentsForDate(date: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fsQuery = query(
      collection(db, 'appointments'),
      where('date', '==', date),
      where('deletedAt', '==', null)
    );
    const unsub = onSnapshot(fsQuery, (snap) => {
      const docs = snap.docs.map(d => ({ _id: d.id, ...d.data() }) as Appointment);
      setAppointments(docs.sort((a, b) => a.time.localeCompare(b.time)));
      setLoading(false);
    });
    return unsub;
  }, [date]);

  return { appointments, loading };
}

export function useAppointmentsForPatient(patientId: string | undefined) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) { setAppointments([]); setLoading(false); return; }
    const fsQuery = query(
      collection(db, 'appointments'),
      where('patientId', '==', patientId),
      where('deletedAt', '==', null)
    );
    const unsub = onSnapshot(fsQuery, (snap) => {
      const docs = snap.docs.map(d => ({ _id: d.id, ...d.data() }) as Appointment);
      setAppointments(docs.sort((a, b) => {
        const dA = `${a.date} ${a.time}`;
        const dB = `${b.date} ${b.time}`;
        return dB.localeCompare(dA);
      }));
      setLoading(false);
    });
    return unsub;
  }, [patientId]);

  return { appointments, loading };
}

export const createAppointment = q.createAppointment;
export const updateAppointment = q.updateAppointment;
export const updateAppointmentStatus = q.updateAppointmentStatus;
export const deleteAppointment = q.deleteAppointment;
export const getAppointmentsInRange = q.getAppointmentsInRange;
