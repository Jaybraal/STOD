import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../db/firebase';
import { useAuth } from '../context/AuthContext';
import type { ClinicConfig } from '../db/schemas';
import * as q from '../db/queries/config';

const DEFAULT_CONFIG: ClinicConfig = {
  clinicName: '',
  doctorName: '',
  phone: '',
  address: '',
};

export function useConfig() {
  const { user } = useAuth();
  const clinicId = user!.uid;
  const [config, setConfig] = useState<ClinicConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, `clinics/${clinicId}/config`, 'clinic'),
      (snap) => {
        setConfig(snap.exists() ? (snap.data() as ClinicConfig) : DEFAULT_CONFIG);
        setLoading(false);
      }
    );
    return unsub;
  }, [clinicId]);

  const updateConfig = (data: Partial<ClinicConfig>) => q.updateConfig(clinicId, data);

  return { config, loading, updateConfig };
}
