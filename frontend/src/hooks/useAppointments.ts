import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../db/firebase';
import { useAuth } from '../context/AuthContext';
import type { Appointment } from '../db/schemas';
import * as q from '../db/queries/appointments';

export function useAppointments() {
  const { user } = useAuth();
  const clinicId = user!.uid;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fsQuery = query(
      collection(db, `clinics/${clinicId}/appointments`),
      where('deletedAt', '==', null)
    );
    const unsub = onSnapshot(fsQuery, (snap) => {
      setAppointments(snap.docs.map(d => ({ _id: d.id, ...d.data() }) as Appointment));
      setLoading(false);
    });
    return unsub;
  }, [clinicId]);

  return { appointments, loading };
}

export function useAppointmentsForDate(date: string) {
  const { user } = useAuth();
  const clinicId = user!.uid;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fsQuery = query(
      collection(db, `clinics/${clinicId}/appointments`),
      where('date', '==', date),
      where('deletedAt', '==', null)
    );
    const unsub = onSnapshot(fsQuery, (snap) => {
      const docs = snap.docs.map(d => ({ _id: d.id, ...d.data() }) as Appointment);
      setAppointments(docs.sort((a, b) => a.time.localeCompare(b.time)));
      setLoading(false);
    });
    return unsub;
  }, [clinicId, date]);

  return { appointments, loading };
}

export function useAppointmentsForPatient(patientId: string | undefined) {
  const { user } = useAuth();
  const clinicId = user!.uid;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) { setAppointments([]); setLoading(false); return; }
    const fsQuery = query(
      collection(db, `clinics/${clinicId}/appointments`),
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
  }, [clinicId, patientId]);

  return { appointments, loading };
}

export function useAppointmentMutations() {
  const { user } = useAuth();
  const clinicId = user!.uid;
  return {
    createAppointment: (data: Parameters<typeof q.createAppointment>[1]) => q.createAppointment(clinicId, data),
    updateAppointment: (id: string, data: Parameters<typeof q.updateAppointment>[2]) => q.updateAppointment(clinicId, id, data),
    updateAppointmentStatus: (id: string, status: Parameters<typeof q.updateAppointmentStatus>[2]) => q.updateAppointmentStatus(clinicId, id, status),
    deleteAppointment: (id: string) => q.deleteAppointment(clinicId, id),
    getAppointment: (id: string) => q.getAppointment(clinicId, id),
    getAppointmentsInRange: (startDate: string, endDate: string) => q.getAppointmentsInRange(clinicId, startDate, endDate),
  };
}
