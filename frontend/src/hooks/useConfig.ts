import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../db/firebase';
import type { ClinicConfig } from '../db/schemas';
import * as q from '../db/queries/config';

const DEFAULT_CONFIG: ClinicConfig = {
  clinicName: '',
  doctorName: '',
  phone: '',
  address: '',
};

export function useConfig() {
  const [config, setConfig] = useState<ClinicConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'clinic'), (snap) => {
      setConfig(snap.exists() ? (snap.data() as ClinicConfig) : DEFAULT_CONFIG);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { config, loading };
}

export const updateConfig = q.updateConfig;
