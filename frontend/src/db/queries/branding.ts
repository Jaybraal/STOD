import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export type BrandingKind = 'logo' | 'signature' | 'stamp';

export async function uploadBranding(clinicId: string, kind: BrandingKind, file: File): Promise<string> {
  const fileRef = ref(storage, `clinics/${clinicId}/branding/${kind}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}
