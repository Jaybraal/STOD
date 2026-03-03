import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { ClinicConfig } from '../schemas';

const docRef = (clinicId: string) => doc(db, `clinics/${clinicId}/config`, 'clinic');

const DEFAULT_CONFIG: ClinicConfig = {
  clinicName: '',
  doctorName: '',
  phone: '',
  address: '',
};

export async function getConfig(clinicId: string): Promise<ClinicConfig> {
  const ref = docRef(clinicId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
  return snap.data() as ClinicConfig;
}

export async function updateConfig(clinicId: string, data: Partial<ClinicConfig>): Promise<void> {
  const ref = docRef(clinicId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { ...DEFAULT_CONFIG, ...data });
  } else {
    await updateDoc(ref, data as Record<string, unknown>);
  }
}
