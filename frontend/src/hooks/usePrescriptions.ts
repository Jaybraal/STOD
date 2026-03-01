import { useEffect, useState, useCallback } from 'react';
import { db } from '../db';
import type { Prescription } from '../db/schemas';
import * as q from '../db/queries/prescriptions';

export function usePrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      setPrescriptions(await q.getAllPrescriptions());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const changes = db.changes({ live: true, since: 'now', selector: { type: 'prescription' } });
    changes.on('change', fetch);
    return () => changes.cancel();
  }, [fetch]);

  return { prescriptions, loading, refetch: fetch };
}

export function usePrescriptionsForPatient(patientId: string | undefined) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!patientId) { setPrescriptions([]); setLoading(false); return; }
    setLoading(true);
    try {
      setPrescriptions(await q.getPrescriptionsForPatient(patientId));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetch();
    const changes = db.changes({ live: true, since: 'now', selector: { type: 'prescription' } });
    changes.on('change', fetch);
    return () => changes.cancel();
  }, [patientId, fetch]);

  return { prescriptions, loading };
}

export const createPrescription = q.createPrescription;
export const updatePrescription = q.updatePrescription;
export const deletePrescription = q.deletePrescription;
export const getPrescription = q.getPrescription;
