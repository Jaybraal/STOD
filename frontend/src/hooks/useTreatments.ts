import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../db/firebase';
import { useAuth } from '../context/AuthContext';
import type { Treatment } from '../db/schemas';
import * as q from '../db/queries/treatments';

export function useTreatments() {
  const { user } = useAuth();
  const clinicId = user!.uid;
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fsQuery = query(
      collection(db, `clinics/${clinicId}/treatments`),
      where('deletedAt', '==', null)
    );
    const unsub = onSnapshot(fsQuery, (snap) => {
      setTreatments(snap.docs.map(d => ({ _id: d.id, ...d.data() }) as Treatment));
      setLoading(false);
    });
    return unsub;
  }, [clinicId]);

  return { treatments, loading };
}

export function useTreatmentsForPatient(patientId: string | undefined) {
  const { user } = useAuth();
  const clinicId = user!.uid;
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) { setTreatments([]); setLoading(false); return; }
    const fsQuery = query(
      collection(db, `clinics/${clinicId}/treatments`),
      where('patientId', '==', patientId),
      where('deletedAt', '==', null)
    );
    const unsub = onSnapshot(fsQuery, (snap) => {
      const docs = snap.docs.map(d => ({ _id: d.id, ...d.data() }) as Treatment);
      setTreatments(docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setLoading(false);
    });
    return unsub;
  }, [clinicId, patientId]);

  return { treatments, loading };
}

export function useTreatmentMutations() {
  const { user } = useAuth();
  const clinicId = user!.uid;
  return {
    getTreatment: (id: string) => q.getTreatment(clinicId, id),
    createTreatment: (data: Parameters<typeof q.createTreatment>[1]) => q.createTreatment(clinicId, data),
    updateTreatment: (id: string, data: Parameters<typeof q.updateTreatment>[2]) => q.updateTreatment(clinicId, id, data),
    updateTreatmentStatus: (id: string, status: Parameters<typeof q.updateTreatmentStatus>[2]) => q.updateTreatmentStatus(clinicId, id, status),
    deleteTreatment: (id: string) => q.deleteTreatment(clinicId, id),
    getTreatmentCostSummary: q.getTreatmentCostSummary,
  };
}
