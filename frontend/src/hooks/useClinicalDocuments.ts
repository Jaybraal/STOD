import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../db/firebase';
import { useAuth } from '../context/AuthContext';
import type { ClinicalDocument } from '../db/schemas';
import * as q from '../db/queries/clinicalDocuments';

const path = (clinicId: string) => `clinics/${clinicId}/clinicalDocuments`;

export function useClinicalDocuments() {
  const { clinicId: _cid } = useAuth(); const clinicId = _cid!;
  const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fsQuery = query(collection(db, path(clinicId)), where('deletedAt', '==', null));
    const unsub = onSnapshot(fsQuery, (snap) => {
      const docs = snap.docs.map((d) => ({ _id: d.id, ...d.data() }) as ClinicalDocument);
      setDocuments(docs.sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    });
    return unsub;
  }, [clinicId]);

  return { documents, loading };
}

export function useClinicalDocumentsForPatient(patientId: string | undefined) {
  const { clinicId: _cid } = useAuth(); const clinicId = _cid!;
  const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) { setDocuments([]); setLoading(false); return; }
    const fsQuery = query(
      collection(db, path(clinicId)),
      where('patientId', '==', patientId),
      where('deletedAt', '==', null)
    );
    const unsub = onSnapshot(fsQuery, (snap) => {
      const docs = snap.docs.map((d) => ({ _id: d.id, ...d.data() }) as ClinicalDocument);
      setDocuments(docs.sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    });
    return unsub;
  }, [clinicId, patientId]);

  return { documents, loading };
}

export function useClinicalDocumentMutations() {
  const { clinicId: _cid } = useAuth(); const clinicId = _cid!;
  return {
    createDocument: (data: Parameters<typeof q.createClinicalDocument>[1]) => q.createClinicalDocument(clinicId, data),
    updateDocument: (id: string, data: Parameters<typeof q.updateClinicalDocument>[2]) => q.updateClinicalDocument(clinicId, id, data),
    deleteDocument: (id: string) => q.deleteClinicalDocument(clinicId, id),
    getDocument: (id: string) => q.getClinicalDocument(clinicId, id),
  };
}
