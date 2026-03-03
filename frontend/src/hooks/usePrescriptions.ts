import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../db/firebase';
import { useAuth } from '../context/AuthContext';
import type { Prescription } from '../db/schemas';
import * as q from '../db/queries/prescriptions';

export function usePrescriptions() {
  const { clinicId: _cid } = useAuth(); const clinicId = _cid!;
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fsQuery = query(
      collection(db, `clinics/${clinicId}/prescriptions`),
      where('deletedAt', '==', null)
    );
    const unsub = onSnapshot(fsQuery, (snap) => {
      const docs = snap.docs.map(d => ({ _id: d.id, ...d.data() }) as Prescription);
      setPrescriptions(docs.sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    });
    return unsub;
  }, [clinicId]);

  return { prescriptions, loading };
}

export function usePrescriptionsForPatient(patientId: string | undefined) {
  const { clinicId: _cid } = useAuth(); const clinicId = _cid!;
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) { setPrescriptions([]); setLoading(false); return; }
    const fsQuery = query(
      collection(db, `clinics/${clinicId}/prescriptions`),
      where('patientId', '==', patientId),
      where('deletedAt', '==', null)
    );
    const unsub = onSnapshot(fsQuery, (snap) => {
      const docs = snap.docs.map(d => ({ _id: d.id, ...d.data() }) as Prescription);
      setPrescriptions(docs.sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    });
    return unsub;
  }, [clinicId, patientId]);

  return { prescriptions, loading };
}

export function usePrescriptionMutations() {
  const { clinicId: _cid } = useAuth(); const clinicId = _cid!;
  return {
    createPrescription: (data: Parameters<typeof q.createPrescription>[1]) => q.createPrescription(clinicId, data),
    updatePrescription: (id: string, data: Parameters<typeof q.updatePrescription>[2]) => q.updatePrescription(clinicId, id, data),
    deletePrescription: (id: string) => q.deletePrescription(clinicId, id),
    getPrescription: (id: string) => q.getPrescription(clinicId, id),
  };
}
