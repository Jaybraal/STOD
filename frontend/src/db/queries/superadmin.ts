import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { ClinicConfig } from '../schemas';

export interface ClinicSummary {
  clinicId: string;
  config: ClinicConfig;
  memberCount: number;
}

// Escucha en tiempo real todas las clínicas del sistema
export function subscribeClinics(
  callback: (clinics: ClinicSummary[]) => void
): () => void {
  // Escucha la colección de clínicas
  const unsub = onSnapshot(collection(db, 'clinics'), async (snap) => {
    // Para cada clínica, cargamos su config y contamos sus miembros
    const results = await Promise.all(
      snap.docs.map(async (clinicDoc) => {
        const clinicId = clinicDoc.id;

        // Leer config del subcollection
        let config: ClinicConfig = {
          clinicName: '',
          doctorName: '',
          phone: '',
          address: '',
        };
        try {
          const configSnap = await getDocs(collection(db, `clinics/${clinicId}/config`));
          configSnap.forEach((d) => {
            if (d.id === 'clinic') config = d.data() as ClinicConfig;
          });
        } catch {
          // ignorar errores de permisos en clínicas sin config
        }

        // Contar miembros (usuarios con este clinicId)
        let memberCount = 0;
        try {
          const usersSnap = await getDocs(
            query(collection(db, 'users'))
          );
          memberCount = usersSnap.docs.filter(
            (d) => d.data().clinicId === clinicId && d.data().status !== 'pending'
          ).length;
        } catch {
          // ignorar
        }

        return { clinicId, config, memberCount };
      })
    );

    callback(results);
  });

  return unsub;
}
