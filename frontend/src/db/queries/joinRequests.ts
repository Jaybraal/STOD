import { collection, query, where, onSnapshot, updateDoc, deleteField, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface ClinicUser {
  uid: string;
  email: string;
  clinicId: string;
  status?: 'pending';
  joinedAt?: string;
}

// Escucha en tiempo real todos los usuarios de una clínica (pendientes + aprobados)
export function subscribeClinicUsers(
  clinicId: string,
  callback: (pending: ClinicUser[], members: ClinicUser[]) => void
): () => void {
  const q = query(collection(db, 'users'), where('clinicId', '==', clinicId));
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as ClinicUser));
    const pending = all.filter((u) => u.status === 'pending');
    const members = all.filter((u) => u.status !== 'pending');
    callback(pending, members);
  });
}

// Aprobar solicitud: quita el campo status
export async function approveMember(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { status: deleteField() });
}

// Rechazar o eliminar un usuario de la clínica
export async function removeMember(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid));
}
