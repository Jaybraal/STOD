import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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

export async function generateJoinCode(clinicId: string): Promise<string> {
  // Eliminar código anterior si existe
  const current = await getConfig(clinicId);
  if (current.joinCode) {
    await deleteDoc(doc(db, 'codes', current.joinCode));
  }
  // Generar código nuevo: 6 caracteres alfanuméricos en mayúsculas
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  // Guardar en colección codes (para búsqueda rápida) y en config
  await setDoc(doc(db, 'codes', code), { clinicId });
  await updateConfig(clinicId, { joinCode: code });
  return code;
}

export async function getClinicIdByCode(code: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'codes', code.toUpperCase()));
  if (!snap.exists()) return null;
  return snap.data().clinicId as string;
}
