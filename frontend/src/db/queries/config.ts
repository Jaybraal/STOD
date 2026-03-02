import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { ClinicConfig } from '../schemas';

const DOC_REF = () => doc(db, 'config', 'clinic');

const DEFAULT_CONFIG: ClinicConfig = {
  clinicName: '',
  doctorName: '',
  phone: '',
  address: '',
};

export async function getConfig(): Promise<ClinicConfig> {
  const snap = await getDoc(DOC_REF());
  if (!snap.exists()) {
    await setDoc(DOC_REF(), DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
  return snap.data() as ClinicConfig;
}

export async function updateConfig(data: Partial<ClinicConfig>): Promise<void> {
  const snap = await getDoc(DOC_REF());
  if (!snap.exists()) {
    await setDoc(DOC_REF(), { ...DEFAULT_CONFIG, ...data });
  } else {
    await updateDoc(DOC_REF(), data as Record<string, unknown>);
  }
}
