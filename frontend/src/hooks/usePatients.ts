import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../db/firebase';
import { useAuth } from '../context/AuthContext';
import type { Patient } from '../db/schemas';
import * as q from '../db/queries/patients';

export function usePatients() {
  const { clinicId: _cid } = useAuth(); const clinicId = _cid!;
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fsQuery = query(
      collection(db, `clinics/${clinicId}/patients`),
      where('deletedAt', '==', null)
    );
    const unsub = onSnapshot(fsQuery, (snap) => {
      const docs = snap.docs.map(d => ({ _id: d.id, ...d.data() }) as Patient);
      setPatients(docs.sort((a, b) => a.name.localeCompare(b.name, 'es')));
      setLoading(false);
    });
    return unsub;
  }, [clinicId]);

  return { patients, loading };
}

export function usePatient(id: string | undefined) {
  const { clinicId: _cid } = useAuth(); const clinicId = _cid!;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setPatient(null); setLoading(false); return; }
    return onSnapshot(
      query(collection(db, `clinics/${clinicId}/patients`), where('__name__', '==', id)),
      (snap) => {
        const d = snap.docs[0];
        setPatient(d ? ({ _id: d.id, ...d.data() } as Patient) : null);
        setLoading(false);
      }
    );
  }, [clinicId, id]);

  return { patient, loading };
}

export function usePatientMutations() {
  const { clinicId: _cid } = useAuth(); const clinicId = _cid!;
  return {
    createPatient: (data: Parameters<typeof q.createPatient>[1]) => q.createPatient(clinicId, data),
    updatePatient: (id: string, data: Parameters<typeof q.updatePatient>[2]) => q.updatePatient(clinicId, id, data),
    deletePatient: (id: string) => q.deletePatient(clinicId, id),
    searchPatients: q.searchPatients,
  };
}
