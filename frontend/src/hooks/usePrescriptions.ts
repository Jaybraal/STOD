import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../db/firebase';
import type { Prescription } from '../db/schemas';
import * as q from '../db/queries/prescriptions';

export function usePrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fsQuery = query(collection(db, 'prescriptions'), where('deletedAt', '==', null));
    const unsub = onSnapshot(fsQuery, (snap) => {
      const docs = snap.docs.map(d => ({ _id: d.id, ...d.data() }) as Prescription);
      setPrescriptions(docs.sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { prescriptions, loading };
}

export function usePrescriptionsForPatient(patientId: string | undefined) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) { setPrescriptions([]); setLoading(false); return; }
    const fsQuery = query(
      collection(db, 'prescriptions'),
      where('patientId', '==', patientId),
      where('deletedAt', '==', null)
    );
    const unsub = onSnapshot(fsQuery, (snap) => {
      const docs = snap.docs.map(d => ({ _id: d.id, ...d.data() }) as Prescription);
      setPrescriptions(docs.sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    });
    return unsub;
  }, [patientId]);

  return { prescriptions, loading };
}

export const createPrescription = q.createPrescription;
export const updatePrescription = q.updatePrescription;
export const deletePrescription = q.deletePrescription;
export const getPrescription = q.getPrescription;
