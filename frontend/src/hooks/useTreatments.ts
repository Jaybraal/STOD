import { useEffect, useState, useCallback } from 'react';
import { db } from '../db';
import type { Treatment } from '../db/schemas';
import * as q from '../db/queries/treatments';

export function useTreatments() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      setTreatments(await q.getAllTreatments());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const changes = db.changes({ live: true, since: 'now', selector: { type: 'treatment' } });
    changes.on('change', fetch);
    return () => changes.cancel();
  }, [fetch]);

  return { treatments, loading, refetch: fetch };
}

export function useTreatmentsForPatient(patientId: string | undefined) {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!patientId) { setTreatments([]); setLoading(false); return; }
    setLoading(true);
    try {
      setTreatments(await q.getTreatmentsForPatient(patientId));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetch();
    const changes = db.changes({ live: true, since: 'now', selector: { type: 'treatment' } });
    changes.on('change', fetch);
    return () => changes.cancel();
  }, [patientId, fetch]);

  return { treatments, loading };
}

export const createTreatment = q.createTreatment;
export const updateTreatment = q.updateTreatment;
export const updateTreatmentStatus = q.updateTreatmentStatus;
export const deleteTreatment = q.deleteTreatment;
export const getTreatmentCostSummary = q.getTreatmentCostSummary;
