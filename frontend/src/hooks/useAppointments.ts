import { useEffect, useState, useCallback } from 'react';
import { db } from '../db';
import type { Appointment } from '../db/schemas';
import * as q from '../db/queries/appointments';

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      setAppointments(await q.getAllAppointments());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const changes = db.changes({ live: true, since: 'now', selector: { type: 'appointment' } });
    changes.on('change', fetch);
    return () => changes.cancel();
  }, [fetch]);

  return { appointments, loading, refetch: fetch };
}

export function useAppointmentsForDate(date: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      setAppointments(await q.getAppointmentsForDate(date));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetch();
    const changes = db.changes({ live: true, since: 'now', selector: { type: 'appointment' } });
    changes.on('change', fetch);
    return () => changes.cancel();
  }, [date, fetch]);

  return { appointments, loading };
}

export function useAppointmentsForPatient(patientId: string | undefined) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!patientId) { setAppointments([]); setLoading(false); return; }
    setLoading(true);
    try {
      setAppointments(await q.getAppointmentsForPatient(patientId));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetch();
    const changes = db.changes({ live: true, since: 'now', selector: { type: 'appointment' } });
    changes.on('change', fetch);
    return () => changes.cancel();
  }, [patientId, fetch]);

  return { appointments, loading };
}

export const createAppointment = q.createAppointment;
export const updateAppointment = q.updateAppointment;
export const updateAppointmentStatus = q.updateAppointmentStatus;
export const deleteAppointment = q.deleteAppointment;
export const getAppointmentsInRange = q.getAppointmentsInRange;
