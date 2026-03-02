import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../db/firebase';
import type { Treatment } from '../db/schemas';
import * as q from '../db/queries/treatments';

export function useTreatments() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fsQuery = query(collection(db, 'treatments'), where('deletedAt', '==', null));
    const unsub = onSnapshot(fsQuery, (snap) => {
      setTreatments(snap.docs.map(d => ({ _id: d.id, ...d.data() }) as Treatment));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { treatments, loading };
}

export function useTreatmentsForPatient(patientId: string | undefined) {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) { setTreatments([]); setLoading(false); return; }
    const fsQuery = query(
      collection(db, 'treatments'),
      where('patientId', '==', patientId),
      where('deletedAt', '==', null)
    );
    const unsub = onSnapshot(fsQuery, (snap) => {
      const docs = snap.docs.map(d => ({ _id: d.id, ...d.data() }) as Treatment);
      setTreatments(docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setLoading(false);
    });
    return unsub;
  }, [patientId]);

  return { treatments, loading };
}

export const createTreatment = q.createTreatment;
export const updateTreatment = q.updateTreatment;
export const updateTreatmentStatus = q.updateTreatmentStatus;
export const deleteTreatment = q.deleteTreatment;
export const getTreatmentCostSummary = q.getTreatmentCostSummary;
