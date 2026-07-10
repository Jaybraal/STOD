/**
 * Migra clinics/{clinicId}/prescriptions -> clinics/{clinicId}/clinicalDocuments (type: 'receta').
 * Idempotente: omite documentos que ya existen en destino. NO borra la colección origen.
 *
 * Uso: configurar las VITE_FIREBASE_* en el entorno y correr:
 *   npx tsx scripts/run-migration.ts <clinicId> [<clinicId> ...]
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { prescriptionToDocument } from '../src/db/migratePrescriptions';
import type { Prescription } from '../src/db/schemas';

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
});
const db = getFirestore(app);

async function migrateClinic(clinicId: string) {
  const src = collection(db, `clinics/${clinicId}/prescriptions`);
  const snap = await getDocs(src);
  let copied = 0, skipped = 0;
  for (const d of snap.docs) {
    const destRef = doc(db, `clinics/${clinicId}/clinicalDocuments`, d.id);
    if ((await getDoc(destRef)).exists()) { skipped++; continue; }
    const p = { _id: d.id, ...d.data() } as Prescription;
    const { _id, ...docData } = prescriptionToDocument(p);
    void _id;
    await setDoc(destRef, docData);
    copied++;
  }
  console.log(`[${clinicId}] copiadas: ${copied}, omitidas: ${skipped}`);
}

async function main() {
  const clinicIds = process.argv.slice(2);
  if (clinicIds.length === 0) { console.error('Uso: tsx scripts/run-migration.ts <clinicId> ...'); process.exit(1); }
  for (const id of clinicIds) await migrateClinic(id);
  console.log('Migración completa.');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
