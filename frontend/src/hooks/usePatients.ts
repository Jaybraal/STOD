import { useEffect, useState, useCallback } from 'react';
import { db } from '../db';
import type { Patient } from '../db/schemas';
import * as q from '../db/queries/patients';

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      setPatients(await q.getAllPatients());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const changes = db.changes({ live: true, since: 'now', selector: { type: 'patient' } });
    changes.on('change', fetch);
    return () => changes.cancel();
  }, [fetch]);

  return { patients, loading, refetch: fetch };
}

export function usePatient(id: string | undefined) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!id) { setPatient(null); setLoading(false); return; }
    setLoading(true);
    try {
      setPatient(await q.getPatient(id));
    } catch {
      setPatient(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
    const changes = db.changes({ live: true, since: 'now', doc_ids: id ? [id] : [] });
    changes.on('change', fetch);
    return () => changes.cancel();
  }, [id, fetch]);

  return { patient, loading };
}

export const createPatient = q.createPatient;
export const updatePatient = q.updatePatient;
export const deletePatient = q.deletePatient;
export const searchPatients = q.searchPatients;
