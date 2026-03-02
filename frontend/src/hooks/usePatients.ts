import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../db/firebase';
import type { Patient } from '../db/schemas';
import * as q from '../db/queries/patients';

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fsQuery = query(collection(db, 'patients'), where('deletedAt', '==', null));
    const unsub = onSnapshot(fsQuery, (snap) => {
      const docs = snap.docs.map(d => ({ _id: d.id, ...d.data() }) as Patient);
      setPatients(docs.sort((a, b) => a.name.localeCompare(b.name, 'es')));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { patients, loading };
}

export function usePatient(id: string | undefined) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setPatient(null); setLoading(false); return; }
    return onSnapshot(
      query(collection(db, 'patients'), where('__name__', '==', id)),
      (snap) => {
        const d = snap.docs[0];
        setPatient(d ? ({ _id: d.id, ...d.data() } as Patient) : null);
        setLoading(false);
      }
    );
  }, [id]);

  return { patient, loading };
}

export const createPatient = q.createPatient;
export const updatePatient = q.updatePatient;
export const deletePatient = q.deletePatient;
export const searchPatients = q.searchPatients;
