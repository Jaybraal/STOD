# Documentos profesionales — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extender el módulo de Recetas de STOD a cinco tipos de documento clínico (receta, certificado, referimiento, orden de laboratorio, orden de imágenes) unificados bajo una sección "Documentos", con branding real (logo/firma/sello) subido por el doctor.

**Architecture:** Una sola colección Firestore `clinicalDocuments` con un campo discriminante `type` y queries CRUD genéricas reutilizadas por los cinco tipos. Cada tipo tiene su propio formulario y su propia plantilla de impresión (componentes simples, sin condicionales gigantes), compartiendo `PrintHeader`/`PrintSignature`. El branding se sube a Firebase Storage y sus URLs se guardan en `ClinicConfig`.

**Tech Stack:** React 19 + TypeScript + Vite, Firebase (Firestore + Storage), Tailwind CSS, react-router-dom, lucide-react. **Vitest** (nuevo) para tests unitarios de lógica pura.

## Global Constraints

- **TypeScript estricto con `verbatimModuleSyntax`:** siempre `import type` para tipos (regla del proyecto).
- **Verificación por tarea = `npm run build` (corre `tsc -b`, debe pasar sin errores) + `npm run test` (Vitest, verde) donde haya tests.** Lo puramente visual se verifica además en navegador con `npm run dev`.
- **Idioma UI en español.** Debe funcionar en móvil y escritorio (STOD es responsive con Sidebar en desktop y BottomNav en móvil).
- **Soft delete:** todo documento se elimina marcando `deletedAt` (nunca borrado físico), patrón de `BaseDoc`.
- **Multi-tenant:** todas las colecciones cuelgan de `clinics/{clinicId}/...`. El `clinicId` viene de `useAuth()`.
- **No romper datos existentes:** la colección vieja `prescriptions` NO se borra; se migra copiando a `clinicalDocuments`.
- Comandos desde `/Users/branel/STOD/frontend` salvo que se indique otra ruta.

---

## Estructura de archivos

**Crear:**
- `frontend/src/db/queries/clinicalDocuments.ts` — CRUD genérico de la colección.
- `frontend/src/db/queries/branding.ts` — subida/borrado de logo/firma/sello en Storage.
- `frontend/src/hooks/useClinicalDocuments.ts` — hooks realtime + mutaciones.
- `frontend/src/utils/documentTypes.ts` — metadatos de tipo (label, icono) + helper `resolveDocType`.
- `frontend/src/utils/documentTypes.test.ts` — tests del helper.
- `frontend/src/utils/branding.ts` — `validateBrandingImage()` (tipo/tamaño).
- `frontend/src/utils/branding.test.ts` — tests de validación.
- `frontend/src/db/migratePrescriptions.ts` — lógica pura de mapeo receta→documento.
- `frontend/src/db/migratePrescriptions.test.ts` — tests del mapeo.
- `frontend/scripts/run-migration.ts` — script ejecutable que corre la migración por clínica.
- `frontend/src/pages/Documentos/index.tsx` — lista unificada.
- `frontend/src/pages/Documentos/SelectorTipo.tsx` — elegir tipo al crear.
- `frontend/src/pages/Documentos/RecetaForm.tsx` — (movido desde Recetas).
- `frontend/src/pages/Documentos/CertificadoForm.tsx`
- `frontend/src/pages/Documentos/ReferimientoForm.tsx`
- `frontend/src/pages/Documentos/OrdenLaboratorioForm.tsx`
- `frontend/src/pages/Documentos/OrdenImagenesForm.tsx`
- `frontend/src/pages/Documentos/DocumentoPrint.tsx` — router de impresión por tipo.
- `frontend/src/pages/Documentos/print/PrintHeader.tsx`
- `frontend/src/pages/Documentos/print/PrintSignature.tsx`
- `frontend/src/pages/Documentos/print/RecetaPrint.tsx`
- `frontend/src/pages/Documentos/print/CertificadoPrint.tsx`
- `frontend/src/pages/Documentos/print/ReferimientoPrint.tsx`
- `frontend/src/pages/Documentos/print/OrdenLaboratorioPrint.tsx`
- `frontend/src/pages/Documentos/print/OrdenImagenesPrint.tsx`
- `frontend/storage.rules` — reglas de Firebase Storage.

**Modificar:**
- `frontend/src/db/schemas.ts` — tipos `DocumentType`, `ClinicalDocument`; campos branding en `ClinicConfig`.
- `frontend/src/db/firebase.ts` — export de `storage`.
- `frontend/src/App.tsx` — rutas `/documentos/*`.
- `frontend/src/components/layout/Sidebar.tsx` — item "Documentos".
- `frontend/src/pages/Configuracion/index.tsx` — sección branding.
- `frontend/src/pages/Pacientes/PacienteDetalle.tsx` — tab usa documentos.
- `frontend/firebase.json` — registrar `storage.rules`.
- `frontend/package.json` — devDeps + scripts de Vitest.
- **Eliminar** al final: carpeta `frontend/src/pages/Recetas/` y `frontend/src/db/queries/prescriptions.ts` + `frontend/src/hooks/usePrescriptions.ts` (tras migrar consumidores).

---

### Task 1: Configurar Vitest

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/utils/smoke.test.ts` (temporal, se borra en Step 6)

**Interfaces:**
- Produces: script `npm run test` (una pasada, sin watch) y `npm run test:watch`.

- [ ] **Step 1: Instalar Vitest**

Run:
```bash
npm install -D vitest@^2
```
Expected: se agrega `vitest` a devDependencies sin errores de peer.

- [ ] **Step 2: Crear config de Vitest**

Create `frontend/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Agregar scripts a package.json**

En `frontend/package.json`, dentro de `"scripts"`, agregar:
```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 4: Escribir test smoke que falla**

Create `frontend/src/utils/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('suma', () => {
    expect(1 + 1).toBe(3);
  });
});
```

- [ ] **Step 5: Correr y verificar que falla**

Run: `npm run test`
Expected: FAIL — `expected 2 to be 3`. Confirma que Vitest ejecuta.

- [ ] **Step 6: Corregir el smoke y verificar verde, luego borrarlo**

Editar el test a `expect(1 + 1).toBe(2)`, correr `npm run test` (Expected: PASS), luego borrar `src/utils/smoke.test.ts`.

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts
git commit -m "chore: configurar Vitest para tests unitarios"
```

---

### Task 2: Tipos de datos

**Files:**
- Modify: `frontend/src/db/schemas.ts`

**Interfaces:**
- Produces:
  - `type DocumentType = 'receta' | 'certificado' | 'referimiento' | 'orden_laboratorio' | 'orden_imagenes'`
  - `interface ClinicalDocument extends BaseDoc` (ver abajo)
  - `ClinicConfig` con `logoUrl?`, `signatureUrl?`, `stampUrl?`, `licenseNumber?`

- [ ] **Step 1: Agregar tipos de documento a schemas.ts**

En `frontend/src/db/schemas.ts`, después del bloque de `Prescription` (línea ~70), agregar:
```ts
// Tipos de documento clínico
export type DocumentType =
  | 'receta'
  | 'certificado'
  | 'referimiento'
  | 'orden_laboratorio'
  | 'orden_imagenes';

// Profesional al que se refiere un paciente
export interface Referral {
  name: string;
  specialty?: string;
}

// Documento clínico unificado (reemplaza Prescription)
export interface ClinicalDocument extends BaseDoc {
  type: DocumentType;
  patientId: string;
  date: string;                 // YYYY-MM-DD
  appointmentId?: string;       // compat con recetas migradas
  doctorNotes?: string;         // común a todos

  medications?: Medication[];   // receta

  restDays?: number;            // certificado
  reason?: string;              // certificado

  referredTo?: Referral;        // referimiento
  clinicalSummary?: string;     // referimiento

  studies?: string[];           // orden_laboratorio / orden_imagenes
  clinicalIndications?: string; // orden_imagenes
}
```

- [ ] **Step 2: Agregar campos de branding a ClinicConfig**

En `frontend/src/db/schemas.ts`, dentro de `interface ClinicConfig`, después de `treatmentFields?`, agregar:
```ts
  logoUrl?: string;
  signatureUrl?: string;
  stampUrl?: string;
  licenseNumber?: string;   // exequátur / licencia — se muestra bajo la firma
```

- [ ] **Step 3: Verificar typecheck**

Run: `npm run build`
Expected: PASS (sin errores de TypeScript). `Prescription` sigue existiendo y no se toca aún.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/db/schemas.ts
git commit -m "feat: tipos ClinicalDocument y campos de branding en ClinicConfig"
```

---

### Task 3: Metadatos de tipo + helper resolveDocType (TDD)

**Files:**
- Create: `frontend/src/utils/documentTypes.ts`
- Test: `frontend/src/utils/documentTypes.test.ts`

**Interfaces:**
- Consumes: `DocumentType` de schemas.
- Produces:
  - `DOCUMENT_TYPE_META: Record<DocumentType, { label: string; short: string }>`
  - `resolveDocType(type: string): DocumentType | null` — devuelve el tipo si es válido, `null` si desconocido.
  - `DOCUMENT_TYPE_LIST: DocumentType[]` (orden de presentación).

- [ ] **Step 1: Escribir tests que fallan**

Create `frontend/src/utils/documentTypes.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { resolveDocType, DOCUMENT_TYPE_META, DOCUMENT_TYPE_LIST } from './documentTypes';

describe('resolveDocType', () => {
  it('acepta tipos válidos', () => {
    expect(resolveDocType('receta')).toBe('receta');
    expect(resolveDocType('orden_imagenes')).toBe('orden_imagenes');
  });
  it('rechaza tipos desconocidos', () => {
    expect(resolveDocType('factura')).toBeNull();
    expect(resolveDocType('')).toBeNull();
  });
});

describe('metadatos', () => {
  it('tiene label para cada tipo de la lista', () => {
    for (const t of DOCUMENT_TYPE_LIST) {
      expect(DOCUMENT_TYPE_META[t].label.length).toBeGreaterThan(0);
    }
  });
  it('lista los 5 tipos', () => {
    expect(DOCUMENT_TYPE_LIST).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm run test`
Expected: FAIL — no encuentra el módulo `./documentTypes`.

- [ ] **Step 3: Implementar el módulo**

Create `frontend/src/utils/documentTypes.ts`:
```ts
import type { DocumentType } from '../db/schemas';

export const DOCUMENT_TYPE_META: Record<DocumentType, { label: string; short: string }> = {
  receta:            { label: 'Receta médica',              short: 'Receta' },
  certificado:       { label: 'Certificado médico',          short: 'Certificado' },
  referimiento:      { label: 'Referimiento médico',         short: 'Referimiento' },
  orden_laboratorio: { label: 'Orden de laboratorio',        short: 'Orden lab.' },
  orden_imagenes:    { label: 'Orden de imágenes diagnósticas', short: 'Orden imágenes' },
};

export const DOCUMENT_TYPE_LIST: DocumentType[] = [
  'receta',
  'certificado',
  'referimiento',
  'orden_laboratorio',
  'orden_imagenes',
];

export function resolveDocType(type: string): DocumentType | null {
  return (DOCUMENT_TYPE_LIST as string[]).includes(type) ? (type as DocumentType) : null;
}
```

- [ ] **Step 4: Correr y verificar verde**

Run: `npm run test`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/documentTypes.ts frontend/src/utils/documentTypes.test.ts
git commit -m "feat: metadatos de tipo de documento y resolveDocType (TDD)"
```

---

### Task 4: Queries genéricas de documentos

**Files:**
- Create: `frontend/src/db/queries/clinicalDocuments.ts`

**Interfaces:**
- Consumes: `db`, `generateId`, `now` (de `../index` y `../firebase`); `ClinicalDocument`.
- Produces (todas reciben `clinicId` como primer argumento):
  - `getClinicalDocument(clinicId, id): Promise<ClinicalDocument>`
  - `createClinicalDocument(clinicId, data): Promise<ClinicalDocument>` donde `data = Omit<ClinicalDocument, '_id'|'createdAt'|'updatedAt'|'deletedAt'>`
  - `updateClinicalDocument(clinicId, id, data: Partial<ClinicalDocument>): Promise<void>`
  - `deleteClinicalDocument(clinicId, id): Promise<void>` (soft delete)

- [ ] **Step 1: Crear el archivo de queries**

Create `frontend/src/db/queries/clinicalDocuments.ts` (copiando el patrón exacto de `prescriptions.ts`):
```ts
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateId, now } from '../index';
import type { ClinicalDocument } from '../schemas';

const col = (clinicId: string) => `clinics/${clinicId}/clinicalDocuments`;

export async function getClinicalDocument(clinicId: string, id: string): Promise<ClinicalDocument> {
  const snap = await getDoc(doc(db, col(clinicId), id));
  if (!snap.exists()) throw new Error('Documento no encontrado');
  return { _id: snap.id, ...snap.data() } as ClinicalDocument;
}

export async function createClinicalDocument(
  clinicId: string,
  data: Omit<ClinicalDocument, '_id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
): Promise<ClinicalDocument> {
  const timestamp = now();
  const id = generateId('doc');
  const docData = { createdAt: timestamp, updatedAt: timestamp, deletedAt: null, ...data };
  await setDoc(doc(db, col(clinicId), id), docData);
  return { _id: id, ...docData };
}

export async function updateClinicalDocument(
  clinicId: string,
  id: string,
  data: Partial<ClinicalDocument>
): Promise<void> {
  const { _id: _, ...updates } = { ...data, updatedAt: now() };
  void _;
  await updateDoc(doc(db, col(clinicId), id), updates as Record<string, unknown>);
}

export async function deleteClinicalDocument(clinicId: string, id: string): Promise<void> {
  await updateDoc(doc(db, col(clinicId), id), { deletedAt: now(), updatedAt: now() });
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/db/queries/clinicalDocuments.ts
git commit -m "feat: queries CRUD genéricas de clinicalDocuments"
```

---

### Task 5: Hooks de documentos

**Files:**
- Create: `frontend/src/hooks/useClinicalDocuments.ts`

**Interfaces:**
- Consumes: queries de Task 4; `useAuth`; `ClinicalDocument`.
- Produces:
  - `useClinicalDocuments(): { documents: ClinicalDocument[]; loading: boolean }` — todos, orden por fecha desc.
  - `useClinicalDocumentsForPatient(patientId?: string): { documents: ClinicalDocument[]; loading: boolean }`
  - `useClinicalDocumentMutations(): { getDocument, createDocument, updateDocument, deleteDocument }` (bindeados a clinicId).

- [ ] **Step 1: Crear el hook**

Create `frontend/src/hooks/useClinicalDocuments.ts` (patrón exacto de `usePrescriptions.ts`):
```ts
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
```

- [ ] **Step 2: Verificar typecheck**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useClinicalDocuments.ts
git commit -m "feat: hooks realtime y mutaciones de clinicalDocuments"
```

---

### Task 6: Firebase Storage + validación de imágenes (TDD)

**Files:**
- Modify: `frontend/src/db/firebase.ts`
- Create: `frontend/src/utils/branding.ts`
- Test: `frontend/src/utils/branding.test.ts`
- Create: `frontend/src/db/queries/branding.ts`
- Create: `frontend/storage.rules`
- Modify: `frontend/firebase.json`

**Interfaces:**
- Produces:
  - `storage` export en `firebase.ts`.
  - `validateBrandingImage(file: { type: string; size: number }): string | null` — devuelve mensaje de error o `null` si válido.
  - `BRANDING_MAX_BYTES = 2 * 1024 * 1024`.
  - `type BrandingKind = 'logo' | 'signature' | 'stamp'`
  - `uploadBranding(clinicId, kind: BrandingKind, file: File): Promise<string>` — sube y devuelve downloadURL.

- [ ] **Step 1: Escribir tests de validación que fallan**

Create `frontend/src/utils/branding.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { validateBrandingImage, BRANDING_MAX_BYTES } from './branding';

describe('validateBrandingImage', () => {
  it('acepta PNG dentro del límite', () => {
    expect(validateBrandingImage({ type: 'image/png', size: 1000 })).toBeNull();
  });
  it('acepta JPEG', () => {
    expect(validateBrandingImage({ type: 'image/jpeg', size: 1000 })).toBeNull();
  });
  it('rechaza tipo no imagen', () => {
    expect(validateBrandingImage({ type: 'application/pdf', size: 1000 })).toMatch(/PNG|JPG/i);
  });
  it('rechaza archivo demasiado grande', () => {
    expect(validateBrandingImage({ type: 'image/png', size: BRANDING_MAX_BYTES + 1 })).toMatch(/2 ?MB/i);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm run test`
Expected: FAIL — módulo `./branding` inexistente.

- [ ] **Step 3: Implementar validación**

Create `frontend/src/utils/branding.ts`:
```ts
export const BRANDING_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED = ['image/png', 'image/jpeg'];

export function validateBrandingImage(file: { type: string; size: number }): string | null {
  if (!ALLOWED.includes(file.type)) return 'La imagen debe ser PNG o JPG.';
  if (file.size > BRANDING_MAX_BYTES) return 'La imagen no puede superar 2 MB.';
  return null;
}
```

- [ ] **Step 4: Correr y verificar verde**

Run: `npm run test`
Expected: PASS (4 tests nuevos).

- [ ] **Step 5: Agregar Storage a firebase.ts**

En `frontend/src/db/firebase.ts`, agregar el import y el export:
```ts
import { getStorage } from 'firebase/storage';
```
y al final del archivo:
```ts
export const storage = getStorage(app);
```

- [ ] **Step 6: Crear queries de branding**

Create `frontend/src/db/queries/branding.ts`:
```ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export type BrandingKind = 'logo' | 'signature' | 'stamp';

export async function uploadBranding(clinicId: string, kind: BrandingKind, file: File): Promise<string> {
  const fileRef = ref(storage, `clinics/${clinicId}/branding/${kind}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}
```

- [ ] **Step 7: Crear reglas de Storage**

Create `frontend/storage.rules`:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /clinics/{clinicId}/branding/{kind} {
      // Dueño de la clínica o miembro aprobado
      allow read, write: if request.auth != null && (
        request.auth.uid == clinicId ||
        (
          firestore.exists(/databases/(default)/documents/users/$(request.auth.uid)) &&
          firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.clinicId == clinicId
        )
      );
    }
  }
}
```

- [ ] **Step 8: Registrar storage.rules en firebase.json**

En `frontend/firebase.json`, agregar la clave `"storage"` al nivel raíz (junto a `"firestore"`):
```json
  "storage": {
    "rules": "storage.rules"
  }
```

- [ ] **Step 9: Verificar typecheck + tests**

Run: `npm run build && npm run test`
Expected: ambos PASS.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/db/firebase.ts frontend/src/utils/branding.ts frontend/src/utils/branding.test.ts frontend/src/db/queries/branding.ts frontend/storage.rules frontend/firebase.json
git commit -m "feat: Firebase Storage + subida y validación de branding (TDD)"
```

---

### Task 7: Sección de branding en Configuración

**Files:**
- Modify: `frontend/src/pages/Configuracion/index.tsx`

**Interfaces:**
- Consumes: `uploadBranding`, `validateBrandingImage`, `useConfig().updateConfig`, `config` (con `logoUrl`/`signatureUrl`/`stampUrl`/`licenseNumber`).

- [ ] **Step 1: Agregar estado y handler de subida**

En `ConfiguracionPage`, tras los estados existentes, agregar:
```tsx
  const [licenseNumber, setLicenseNumber] = useState('');
  const [uploadingKind, setUploadingKind] = useState<BrandingKind | null>(null);
  const [brandingError, setBrandingError] = useState('');
  const [brandingSaved, setBrandingSaved] = useState(false);
```
Dentro del `useEffect` que sincroniza `config`, agregar:
```tsx
      setLicenseNumber(config.licenseNumber || '');
```
Agregar el handler:
```tsx
  const handleBrandingUpload = async (kind: BrandingKind, file: File | undefined) => {
    if (!file || !clinicId) return;
    const err = validateBrandingImage(file);
    if (err) { setBrandingError(err); return; }
    setBrandingError('');
    setUploadingKind(kind);
    try {
      const url = await uploadBranding(clinicId, kind, file);
      const field = kind === 'logo' ? 'logoUrl' : kind === 'signature' ? 'signatureUrl' : 'stampUrl';
      await updateConfig({ [field]: url });
    } catch {
      setBrandingError('Error al subir la imagen. Revisa tu conexión.');
    } finally {
      setUploadingKind(null);
    }
  };

  const handleSaveLicense = async () => {
    await updateConfig({ licenseNumber });
    setBrandingSaved(true);
    setTimeout(() => setBrandingSaved(false), 2000);
  };
```

- [ ] **Step 2: Agregar imports**

En la cabecera de imports del archivo, agregar:
```tsx
import { uploadBranding, type BrandingKind } from '../../db/queries/branding';
import { validateBrandingImage } from '../../utils/branding';
```
Y agregar `Image` y `PenTool` y `Stamp` a los iconos de `lucide-react` ya importados (usar `ImageIcon` si `Image` colisiona: importar como `Image as ImageIcon`).

- [ ] **Step 3: Renderizar la tarjeta de branding**

Justo después de la Card de "Datos del consultorio" (antes de la de tipo de consultorio), agregar:
```tsx
        {/* Branding: logo, firma, sello */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-1">Logo, firma y sello</h2>
          <p className="text-sm text-slate-500 mb-4">
            Aparecen en los documentos que generes (recetas, certificados, órdenes...).
            Formatos PNG o JPG, máximo 2 MB.
          </p>
          {brandingError && <p className="text-sm text-red-500 mb-3">{brandingError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              { kind: 'logo' as const, label: 'Logo', url: config?.logoUrl },
              { kind: 'signature' as const, label: 'Firma', url: config?.signatureUrl },
              { kind: 'stamp' as const, label: 'Sello', url: config?.stampUrl },
            ]).map(({ kind, label, url }) => (
              <div key={kind} className="border border-slate-200 rounded-xl p-3 flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">{label}</span>
                <div className="w-full h-24 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden">
                  {url
                    ? <img src={url} alt={label} className="max-h-full max-w-full object-contain" />
                    : <span className="text-slate-300 text-xs">Sin {label.toLowerCase()}</span>}
                </div>
                <label className="text-xs text-sky-600 hover:text-sky-700 cursor-pointer font-medium">
                  {uploadingKind === kind ? 'Subiendo...' : url ? 'Cambiar' : 'Subir'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    disabled={uploadingKind !== null}
                    onChange={(e) => handleBrandingUpload(kind, e.target.files?.[0])}
                  />
                </label>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-end gap-3">
            <Input
              label="Número de licencia / exequátur"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="CMP 123456"
              className="flex-1"
            />
            <Button type="button" onClick={handleSaveLicense}>
              {brandingSaved ? <><Check size={16} /> Guardado</> : <><Save size={16} /> Guardar</>}
            </Button>
          </div>
        </Card>
```

- [ ] **Step 4: Verificar typecheck + navegador**

Run: `npm run build`
Expected: PASS.
Luego `npm run dev`, ir a Configuración: se ve la tarjeta con 3 slots; subir un PNG pequeño muestra la vista previa; subir un PDF muestra el error de formato.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Configuracion/index.tsx
git commit -m "feat: sección de logo, firma, sello y licencia en Configuración"
```

---

### Task 8: Componentes de impresión compartidos

**Files:**
- Create: `frontend/src/pages/Documentos/print/PrintHeader.tsx`
- Create: `frontend/src/pages/Documentos/print/PrintSignature.tsx`

**Interfaces:**
- Consumes: `ClinicConfig`, `Patient`.
- Produces:
  - `<PrintHeader config={ClinicConfig | null} />`
  - `<PrintSignature config={ClinicConfig | null} />`

- [ ] **Step 1: Crear PrintHeader**

Create `frontend/src/pages/Documentos/print/PrintHeader.tsx`:
```tsx
import type { ClinicConfig } from '../../../db/schemas';

export function PrintHeader({ config }: { config: ClinicConfig | null }) {
  return (
    <div style={{ borderBottom: '2px solid #0ea5e9', paddingBottom: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      {config?.logoUrl && (
        <img src={config.logoUrl} alt="Logo" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
      )}
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>
          {config?.clinicName || 'Clínica'}
        </h1>
        {config?.doctorName && (
          <p style={{ margin: '4px 0 0', fontSize: '16px', color: '#64748b' }}>Dr. {config.doctorName}</p>
        )}
        {config?.phone && (
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>Tel. {config.phone}</p>
        )}
        {config?.address && (
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#94a3b8' }}>{config.address}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear PrintSignature**

Create `frontend/src/pages/Documentos/print/PrintSignature.tsx`:
```tsx
import type { ClinicConfig } from '../../../db/schemas';

export function PrintSignature({ config }: { config: ClinicConfig | null }) {
  return (
    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        {config?.signatureUrl
          ? <img src={config.signatureUrl} alt="Firma" style={{ height: '48px', objectFit: 'contain', marginBottom: '4px' }} />
          : <div style={{ borderBottom: '1px solid #0f172a', height: '48px', marginBottom: '8px' }} />}
        <div style={{ borderTop: config?.signatureUrl ? '1px solid #0f172a' : 'none', paddingTop: '4px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Firma del médico</p>
          {config?.doctorName && (
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>Dr. {config.doctorName}</p>
          )}
          {config?.licenseNumber && (
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>{config.licenseNumber}</p>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        {config?.stampUrl
          ? <img src={config.stampUrl} alt="Sello" style={{ height: '72px', objectFit: 'contain' }} />
          : <div style={{ borderBottom: '1px solid #0f172a', height: '48px', marginBottom: '8px' }} />}
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>Sello</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `npm run build`
Expected: PASS (aún no se usan; import sin consumidor es válido).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Documentos/print/PrintHeader.tsx frontend/src/pages/Documentos/print/PrintSignature.tsx
git commit -m "feat: componentes de impresión compartidos (header, firma/sello)"
```

---

### Task 9: Plantillas de impresión por tipo + router de impresión

**Files:**
- Create: `frontend/src/pages/Documentos/print/RecetaPrint.tsx`
- Create: `frontend/src/pages/Documentos/print/CertificadoPrint.tsx`
- Create: `frontend/src/pages/Documentos/print/ReferimientoPrint.tsx`
- Create: `frontend/src/pages/Documentos/print/OrdenLaboratorioPrint.tsx`
- Create: `frontend/src/pages/Documentos/print/OrdenImagenesPrint.tsx`
- Create: `frontend/src/pages/Documentos/DocumentoPrint.tsx`

**Interfaces:**
- Consumes: `ClinicalDocument`, `Patient`, `ClinicConfig`, `PrintHeader`, `PrintSignature`, `getClinicalDocument`, `getPatient`, `getConfig`, `formatDate`, `resolveDocType`.
- Cada plantilla: `({ doc, patient, config }: { doc: ClinicalDocument; patient: Patient; config: ClinicConfig | null }) => JSX`.
- `DocumentoPrint`: componente de ruta (`/documentos/:id/imprimir`), carga datos y despacha por `doc.type`.

- [ ] **Step 1: Crear un bloque de layout reutilizable (info paciente/fecha)**

Create `frontend/src/pages/Documentos/print/PrintPatientRow.tsx`:
```tsx
import type { Patient } from '../../../db/schemas';
import { formatDate } from '../../../utils/dateUtils';

export function PrintPatientRow({ patient, date }: { patient: Patient; date: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
      <div>
        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paciente</p>
        <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{patient.name}</p>
        {patient.dob && (
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
            Fecha nacimiento: {formatDate(patient.dob)}
          </p>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</p>
        <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{formatDate(date)}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear RecetaPrint (migra el contenido actual de RecetaPrint.tsx)**

Create `frontend/src/pages/Documentos/print/RecetaPrint.tsx`:
```tsx
import type { ClinicalDocument, Patient, ClinicConfig } from '../../../db/schemas';
import { PrintPatientRow } from './PrintPatientRow';

export function RecetaPrint({ doc, patient }: { doc: ClinicalDocument; patient: Patient; config: ClinicConfig | null }) {
  const meds = doc.medications ?? [];
  return (
    <>
      <PrintPatientRow patient={patient} date={doc.date} />
      <div style={{ marginBottom: '16px' }}>
        <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#0ea5e9', fontStyle: 'italic' }}>Rx</span>
      </div>
      <div style={{ marginBottom: '28px' }}>
        {meds.map((med, idx) => (
          <div key={med.id} style={{ marginBottom: '16px', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', pageBreakInside: 'avoid' }}>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{idx + 1}. {med.name}</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569' }}>
              {med.dosage} — {med.frequency}{med.duration ? ` por ${med.duration}` : ''}
            </p>
            {med.instructions && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>* {med.instructions}</p>
            )}
          </div>
        ))}
      </div>
      {doc.doctorNotes && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Indicaciones</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>{doc.doctorNotes}</p>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: Crear CertificadoPrint**

Create `frontend/src/pages/Documentos/print/CertificadoPrint.tsx`:
```tsx
import type { ClinicalDocument, Patient, ClinicConfig } from '../../../db/schemas';
import { PrintPatientRow } from './PrintPatientRow';

export function CertificadoPrint({ doc, patient }: { doc: ClinicalDocument; patient: Patient; config: ClinicConfig | null }) {
  return (
    <>
      <h2 style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '0.08em', color: '#0f172a', marginBottom: '24px' }}>CERTIFICADO MÉDICO</h2>
      <PrintPatientRow patient={patient} date={doc.date} />
      <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.7 }}>
        Certifico que <strong>{patient.name}</strong> ha sido evaluado(a) en esta consulta
        {doc.reason ? `, con motivo de: ${doc.reason}.` : '.'}
        {doc.restDays ? ` Se recomienda reposo médico por ${doc.restDays} día(s).` : ''}
      </p>
      {doc.doctorNotes && (
        <p style={{ marginTop: '16px', fontSize: '13px', color: '#475569' }}>{doc.doctorNotes}</p>
      )}
    </>
  );
}
```

- [ ] **Step 4: Crear ReferimientoPrint**

Create `frontend/src/pages/Documentos/print/ReferimientoPrint.tsx`:
```tsx
import type { ClinicalDocument, Patient, ClinicConfig } from '../../../db/schemas';
import { PrintPatientRow } from './PrintPatientRow';

export function ReferimientoPrint({ doc, patient }: { doc: ClinicalDocument; patient: Patient; config: ClinicConfig | null }) {
  return (
    <>
      <h2 style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '0.08em', color: '#0f172a', marginBottom: '24px' }}>REFERIMIENTO MÉDICO</h2>
      <PrintPatientRow patient={patient} date={doc.date} />
      {doc.referredTo?.name && (
        <p style={{ fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
          <strong>A:</strong> {doc.referredTo.name}
          {doc.referredTo.specialty ? ` — ${doc.referredTo.specialty}` : ''}
        </p>
      )}
      {doc.reason && (
        <div style={{ marginBottom: '12px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Motivo</p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569' }}>{doc.reason}</p>
        </div>
      )}
      {doc.clinicalSummary && (
        <div style={{ marginBottom: '12px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Resumen clínico</p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569' }}>{doc.clinicalSummary}</p>
        </div>
      )}
      {doc.doctorNotes && (
        <p style={{ marginTop: '8px', fontSize: '13px', color: '#475569' }}>{doc.doctorNotes}</p>
      )}
    </>
  );
}
```

- [ ] **Step 5: Crear OrdenLaboratorioPrint**

Create `frontend/src/pages/Documentos/print/OrdenLaboratorioPrint.tsx`:
```tsx
import type { ClinicalDocument, Patient, ClinicConfig } from '../../../db/schemas';
import { PrintPatientRow } from './PrintPatientRow';

export function OrdenLaboratorioPrint({ doc, patient }: { doc: ClinicalDocument; patient: Patient; config: ClinicConfig | null }) {
  const studies = doc.studies ?? [];
  return (
    <>
      <h2 style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '0.08em', color: '#0f172a', marginBottom: '24px' }}>ORDEN DE LABORATORIO</h2>
      <PrintPatientRow patient={patient} date={doc.date} />
      <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Estudios solicitados</p>
      <ul style={{ margin: 0, paddingLeft: '18px' }}>
        {studies.map((s, i) => (
          <li key={i} style={{ fontSize: '14px', color: '#334155', marginBottom: '6px' }}>{s}</li>
        ))}
      </ul>
      {doc.doctorNotes && (
        <p style={{ marginTop: '16px', fontSize: '13px', color: '#475569' }}>{doc.doctorNotes}</p>
      )}
    </>
  );
}
```

- [ ] **Step 6: Crear OrdenImagenesPrint**

Create `frontend/src/pages/Documentos/print/OrdenImagenesPrint.tsx`:
```tsx
import type { ClinicalDocument, Patient, ClinicConfig } from '../../../db/schemas';
import { PrintPatientRow } from './PrintPatientRow';

export function OrdenImagenesPrint({ doc, patient }: { doc: ClinicalDocument; patient: Patient; config: ClinicConfig | null }) {
  const studies = doc.studies ?? [];
  return (
    <>
      <h2 style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '0.08em', color: '#0f172a', marginBottom: '24px' }}>ORDEN DE IMÁGENES DIAGNÓSTICAS</h2>
      <PrintPatientRow patient={patient} date={doc.date} />
      <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Estudio solicitado</p>
      <ul style={{ margin: 0, paddingLeft: '18px' }}>
        {studies.map((s, i) => (
          <li key={i} style={{ fontSize: '14px', color: '#334155', marginBottom: '6px' }}>{s}</li>
        ))}
      </ul>
      {doc.clinicalIndications && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Indicaciones clínicas</p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569' }}>{doc.clinicalIndications}</p>
        </div>
      )}
      {doc.doctorNotes && (
        <p style={{ marginTop: '16px', fontSize: '13px', color: '#475569' }}>{doc.doctorNotes}</p>
      )}
    </>
  );
}
```

- [ ] **Step 7: Crear DocumentoPrint (router de impresión)**

Create `frontend/src/pages/Documentos/DocumentoPrint.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getClinicalDocument } from '../../db/queries/clinicalDocuments';
import { getPatient } from '../../db/queries/patients';
import { getConfig } from '../../db/queries/config';
import type { ClinicalDocument, Patient, ClinicConfig } from '../../db/schemas';
import { PrintHeader } from './print/PrintHeader';
import { PrintSignature } from './print/PrintSignature';
import { RecetaPrint } from './print/RecetaPrint';
import { CertificadoPrint } from './print/CertificadoPrint';
import { ReferimientoPrint } from './print/ReferimientoPrint';
import { OrdenLaboratorioPrint } from './print/OrdenLaboratorioPrint';
import { OrdenImagenesPrint } from './print/OrdenImagenesPrint';
import { Printer, ArrowLeft } from 'lucide-react';

const BODIES = {
  receta: RecetaPrint,
  certificado: CertificadoPrint,
  referimiento: ReferimientoPrint,
  orden_laboratorio: OrdenLaboratorioPrint,
  orden_imagenes: OrdenImagenesPrint,
} as const;

export function DocumentoPrint() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clinicId } = useAuth();
  const [doc, setDoc] = useState<ClinicalDocument | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [config, setConfig] = useState<ClinicConfig | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getClinicalDocument(clinicId!, id), getConfig(clinicId!)]).then(async ([d, cfg]) => {
      setDoc(d);
      setConfig(cfg);
      setPatient(await getPatient(clinicId!, d.patientId));
    });
  }, [id, clinicId]);

  if (!doc || !patient) {
    return <div className="flex items-center justify-center h-screen text-slate-400">Cargando documento...</div>;
  }

  const Body = BODIES[doc.type];
  if (!Body) {
    return <div className="flex items-center justify-center h-screen text-slate-400">Tipo de documento no reconocido.</div>;
  }

  return (
    <>
      <div className="no-print fixed top-0 left-0 right-0 bg-slate-800 text-white px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex-1" />
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Printer size={16} /> Imprimir / Guardar PDF
        </button>
      </div>

      <div id="print-area" style={{ maxWidth: '700px', margin: '80px auto 40px', padding: '40px', backgroundColor: '#fff', fontFamily: 'Georgia, serif' }}>
        <PrintHeader config={config} />
        <Body doc={doc} patient={patient} config={config} />
        <PrintSignature config={config} />
        <p style={{ marginTop: '20px', fontSize: '10px', color: '#cbd5e1', textAlign: 'center' }}>
          Este documento fue generado por STOD — Sistema de Odontología
        </p>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          #print-area { margin: 0 auto !important; padding: 20px !important; }
          body { background: white; }
        }
      `}</style>
    </>
  );
}
```

- [ ] **Step 8: Verificar typecheck**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/pages/Documentos/print frontend/src/pages/Documentos/DocumentoPrint.tsx
git commit -m "feat: plantillas de impresión por tipo + router de impresión"
```

---

### Task 10: Formularios por tipo

**Files:**
- Create: `frontend/src/pages/Documentos/RecetaForm.tsx`
- Create: `frontend/src/pages/Documentos/CertificadoForm.tsx`
- Create: `frontend/src/pages/Documentos/ReferimientoForm.tsx`
- Create: `frontend/src/pages/Documentos/OrdenLaboratorioForm.tsx`
- Create: `frontend/src/pages/Documentos/OrdenImagenesForm.tsx`

**Interfaces:**
- Consumes: `usePatients`, `useClinicalDocumentMutations`, `useSearchParams` (`?paciente=`), `ClinicalDocument`, `Medication`, `generateId`, `todayStr`.
- Cada form maneja crear (`/documentos/nuevo/:tipo`) y editar (`/documentos/:id/editar`). Al crear, navega a `/documentos/:id/imprimir`. Fija su propio `type`.

- [ ] **Step 1: Crear RecetaForm (migrado, escribe `type: 'receta'`)**

Create `frontend/src/pages/Documentos/RecetaForm.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import { useClinicalDocumentMutations } from '../../hooks/useClinicalDocuments';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { LoadingPage } from '../../components/ui/Spinner';
import type { Medication } from '../../db/schemas';
import { todayStr } from '../../utils/dateUtils';
import { generateId } from '../../db';
import { Save, Trash2, Plus, X, Printer } from 'lucide-react';

const EMPTY_MED = (): Medication => ({ id: generateId('med'), name: '', dosage: '', frequency: '', duration: '', instructions: '' });

export function RecetaForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);
  const { patients, loading: pLoading } = usePatients();
  const { getDocument, createDocument, updateDocument, deleteDocument } = useClinicalDocumentMutations();

  const [patientId, setPatientId] = useState(searchParams.get('paciente') || '');
  const [date, setDate] = useState(todayStr());
  const [medications, setMedications] = useState<Medication[]>([EMPTY_MED()]);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing || !id) return;
    getDocument(id).then((d) => {
      setPatientId(d.patientId);
      setDate(d.date);
      setMedications(d.medications?.length ? d.medications : [EMPTY_MED()]);
      setDoctorNotes(d.doctorNotes || '');
      setLoading(false);
    });
  }, [id, isEditing]);

  const addMed = () => setMedications((m) => [...m, EMPTY_MED()]);
  const removeMed = (mid: string) => setMedications((m) => m.filter((x) => x.id !== mid));
  const updateMed = (mid: string, field: keyof Medication, value: string) =>
    setMedications((m) => m.map((x) => (x.id === mid ? { ...x, [field]: value } : x)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { setError('Selecciona un paciente'); return; }
    setSaving(true);
    try {
      const payload = { type: 'receta' as const, patientId, date, medications, doctorNotes };
      if (isEditing && id) { await updateDocument(id, payload); navigate(-1); }
      else { const created = await createDocument(payload); navigate(`/documentos/${created._id}/imprimir`); }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!id || !confirm('¿Eliminar esta receta?')) return;
    await deleteDocument(id);
    navigate('/documentos');
  };

  if (loading || pLoading) return <LoadingPage />;

  return (
    <div>
      <Header title={isEditing ? 'Editar receta' : 'Nueva receta'} />
      <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-5 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Paciente *"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            options={patients.map((p) => ({ value: p._id, label: p.name }))}
            placeholder="Seleccionar paciente..."
            error={error}
          />
          <Input label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700">Medicamentos</label>
            <Button type="button" variant="ghost" size="sm" onClick={addMed}><Plus size={14} /> Agregar</Button>
          </div>
          <div className="space-y-4">
            {medications.map((med, idx) => (
              <div key={med.id} className="bg-slate-50 rounded-xl p-4 space-y-3 relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Medicamento {idx + 1}</span>
                  {medications.length > 1 && (
                    <button type="button" onClick={() => removeMed(med.id)} className="text-slate-400 hover:text-red-500 transition"><X size={16} /></button>
                  )}
                </div>
                <Input label="Nombre del medicamento" value={med.name} onChange={(e) => updateMed(med.id, 'name', e.target.value)} placeholder="Amoxicilina 500mg" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Dosis" value={med.dosage} onChange={(e) => updateMed(med.id, 'dosage', e.target.value)} placeholder="1 tableta" />
                  <Input label="Frecuencia" value={med.frequency} onChange={(e) => updateMed(med.id, 'frequency', e.target.value)} placeholder="Cada 8 horas" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Duración" value={med.duration} onChange={(e) => updateMed(med.id, 'duration', e.target.value)} placeholder="7 días" />
                  <Input label="Instrucciones" value={med.instructions} onChange={(e) => updateMed(med.id, 'instructions', e.target.value)} placeholder="Con alimentos" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Indicaciones del doctor</label>
          <textarea value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} rows={3} placeholder="Reposo, dieta blanda..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
        </div>
        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button type="submit" disabled={saving}><Save size={16} /> {saving ? 'Guardando...' : isEditing ? 'Guardar' : 'Guardar e imprimir'}</Button>
          {isEditing && (
            <>
              <Button type="button" variant="secondary" onClick={() => navigate(`/documentos/${id}/imprimir`)}><Printer size={16} /> Imprimir</Button>
              <Button type="button" variant="danger" className="ml-auto" onClick={handleDelete}><Trash2 size={16} /></Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Crear un componente auxiliar de campos comunes**

Create `frontend/src/pages/Documentos/DocFormShell.tsx`:
```tsx
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import type { Patient } from '../../db/schemas';
import { Save, Trash2, Printer } from 'lucide-react';

export function DocFormShell({
  title, patients, patientId, setPatientId, date, setDate, error,
  isEditing, saving, onSubmit, onDelete, docId, children,
}: {
  title: string;
  patients: Patient[];
  patientId: string;
  setPatientId: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  error?: string;
  isEditing: boolean;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  docId?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div>
      <Header title={title} />
      <form onSubmit={onSubmit} className="p-4 lg:p-6 space-y-5 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Paciente *"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            options={patients.map((p) => ({ value: p._id, label: p.name }))}
            placeholder="Seleccionar paciente..."
            error={error}
          />
          <Input label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {children}
        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button type="submit" disabled={saving}><Save size={16} /> {saving ? 'Guardando...' : isEditing ? 'Guardar' : 'Guardar e imprimir'}</Button>
          {isEditing && docId && (
            <>
              <Button type="button" variant="secondary" onClick={() => navigate(`/documentos/${docId}/imprimir`)}><Printer size={16} /> Imprimir</Button>
              <Button type="button" variant="danger" className="ml-auto" onClick={onDelete}><Trash2 size={16} /></Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export function LabeledTextarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
    </div>
  );
}
```

- [ ] **Step 3: Crear CertificadoForm**

Create `frontend/src/pages/Documentos/CertificadoForm.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import { useClinicalDocumentMutations } from '../../hooks/useClinicalDocuments';
import { Input } from '../../components/ui/Input';
import { LoadingPage } from '../../components/ui/Spinner';
import { todayStr } from '../../utils/dateUtils';
import { DocFormShell, LabeledTextarea } from './DocFormShell';

export function CertificadoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);
  const { patients, loading: pLoading } = usePatients();
  const { getDocument, createDocument, updateDocument, deleteDocument } = useClinicalDocumentMutations();

  const [patientId, setPatientId] = useState(searchParams.get('paciente') || '');
  const [date, setDate] = useState(todayStr());
  const [reason, setReason] = useState('');
  const [restDays, setRestDays] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing || !id) return;
    getDocument(id).then((d) => {
      setPatientId(d.patientId); setDate(d.date);
      setReason(d.reason || ''); setRestDays(d.restDays != null ? String(d.restDays) : '');
      setDoctorNotes(d.doctorNotes || ''); setLoading(false);
    });
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { setError('Selecciona un paciente'); return; }
    setSaving(true);
    try {
      const payload = { type: 'certificado' as const, patientId, date, reason, restDays: restDays ? Number(restDays) : undefined, doctorNotes };
      if (isEditing && id) { await updateDocument(id, payload); navigate(-1); }
      else { const created = await createDocument(payload); navigate(`/documentos/${created._id}/imprimir`); }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!id || !confirm('¿Eliminar este certificado?')) return;
    await deleteDocument(id); navigate('/documentos');
  };

  if (loading || pLoading) return <LoadingPage />;

  return (
    <DocFormShell
      title={isEditing ? 'Editar certificado' : 'Nuevo certificado'}
      patients={patients} patientId={patientId} setPatientId={setPatientId}
      date={date} setDate={setDate} error={error}
      isEditing={isEditing} saving={saving} onSubmit={handleSubmit} onDelete={handleDelete} docId={id}
    >
      <LabeledTextarea label="Motivo / evaluación" value={reason} onChange={setReason} placeholder="Evaluado por cuadro gripal..." />
      <Input label="Días de reposo (opcional)" type="number" min={0} value={restDays} onChange={(e) => setRestDays(e.target.value)} placeholder="1" />
      <LabeledTextarea label="Observaciones (opcional)" value={doctorNotes} onChange={setDoctorNotes} />
    </DocFormShell>
  );
}
```

- [ ] **Step 4: Crear ReferimientoForm**

Create `frontend/src/pages/Documentos/ReferimientoForm.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import { useClinicalDocumentMutations } from '../../hooks/useClinicalDocuments';
import { Input } from '../../components/ui/Input';
import { LoadingPage } from '../../components/ui/Spinner';
import { todayStr } from '../../utils/dateUtils';
import { DocFormShell, LabeledTextarea } from './DocFormShell';

export function ReferimientoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);
  const { patients, loading: pLoading } = usePatients();
  const { getDocument, createDocument, updateDocument, deleteDocument } = useClinicalDocumentMutations();

  const [patientId, setPatientId] = useState(searchParams.get('paciente') || '');
  const [date, setDate] = useState(todayStr());
  const [toName, setToName] = useState('');
  const [toSpecialty, setToSpecialty] = useState('');
  const [reason, setReason] = useState('');
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing || !id) return;
    getDocument(id).then((d) => {
      setPatientId(d.patientId); setDate(d.date);
      setToName(d.referredTo?.name || ''); setToSpecialty(d.referredTo?.specialty || '');
      setReason(d.reason || ''); setClinicalSummary(d.clinicalSummary || '');
      setDoctorNotes(d.doctorNotes || ''); setLoading(false);
    });
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { setError('Selecciona un paciente'); return; }
    setSaving(true);
    try {
      const payload = {
        type: 'referimiento' as const, patientId, date,
        referredTo: { name: toName, specialty: toSpecialty || undefined },
        reason, clinicalSummary, doctorNotes,
      };
      if (isEditing && id) { await updateDocument(id, payload); navigate(-1); }
      else { const created = await createDocument(payload); navigate(`/documentos/${created._id}/imprimir`); }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!id || !confirm('¿Eliminar este referimiento?')) return;
    await deleteDocument(id); navigate('/documentos');
  };

  if (loading || pLoading) return <LoadingPage />;

  return (
    <DocFormShell
      title={isEditing ? 'Editar referimiento' : 'Nuevo referimiento'}
      patients={patients} patientId={patientId} setPatientId={setPatientId}
      date={date} setDate={setDate} error={error}
      isEditing={isEditing} saving={saving} onSubmit={handleSubmit} onDelete={handleDelete} docId={id}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Referir a (nombre)" value={toName} onChange={(e) => setToName(e.target.value)} placeholder="Dr. Carlos Ramírez" />
        <Input label="Especialidad (opcional)" value={toSpecialty} onChange={(e) => setToSpecialty(e.target.value)} placeholder="Cardiología" />
      </div>
      <LabeledTextarea label="Motivo" value={reason} onChange={setReason} placeholder="Evaluación por..." />
      <LabeledTextarea label="Resumen clínico" value={clinicalSummary} onChange={setClinicalSummary} />
      <LabeledTextarea label="Observaciones (opcional)" value={doctorNotes} onChange={setDoctorNotes} />
    </DocFormShell>
  );
}
```

- [ ] **Step 5: Crear un editor de lista de estudios reutilizable**

Create `frontend/src/pages/Documentos/StudyListEditor.tsx`:
```tsx
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Plus, X } from 'lucide-react';

export function StudyListEditor({ studies, setStudies, label }: {
  studies: string[]; setStudies: (s: string[]) => void; label: string;
}) {
  const update = (i: number, v: string) => setStudies(studies.map((s, idx) => (idx === i ? v : s)));
  const remove = (i: number) => setStudies(studies.filter((_, idx) => idx !== i));
  const add = () => setStudies([...studies, '']);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        <Button type="button" variant="ghost" size="sm" onClick={add}><Plus size={14} /> Agregar</Button>
      </div>
      <div className="space-y-2">
        {studies.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input className="flex-1" value={s} onChange={(e) => update(i, e.target.value)} placeholder="Ej: Radiografía panorámica" />
            {studies.length > 1 && (
              <button type="button" onClick={() => remove(i)} className="text-slate-400 hover:text-red-500 p-2"><X size={16} /></button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Crear OrdenLaboratorioForm**

Create `frontend/src/pages/Documentos/OrdenLaboratorioForm.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import { useClinicalDocumentMutations } from '../../hooks/useClinicalDocuments';
import { LoadingPage } from '../../components/ui/Spinner';
import { todayStr } from '../../utils/dateUtils';
import { DocFormShell, LabeledTextarea } from './DocFormShell';
import { StudyListEditor } from './StudyListEditor';

export function OrdenLaboratorioForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);
  const { patients, loading: pLoading } = usePatients();
  const { getDocument, createDocument, updateDocument, deleteDocument } = useClinicalDocumentMutations();

  const [patientId, setPatientId] = useState(searchParams.get('paciente') || '');
  const [date, setDate] = useState(todayStr());
  const [studies, setStudies] = useState<string[]>(['']);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing || !id) return;
    getDocument(id).then((d) => {
      setPatientId(d.patientId); setDate(d.date);
      setStudies(d.studies?.length ? d.studies : ['']);
      setDoctorNotes(d.doctorNotes || ''); setLoading(false);
    });
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { setError('Selecciona un paciente'); return; }
    setSaving(true);
    try {
      const payload = { type: 'orden_laboratorio' as const, patientId, date, studies: studies.filter((s) => s.trim()), doctorNotes };
      if (isEditing && id) { await updateDocument(id, payload); navigate(-1); }
      else { const created = await createDocument(payload); navigate(`/documentos/${created._id}/imprimir`); }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!id || !confirm('¿Eliminar esta orden?')) return;
    await deleteDocument(id); navigate('/documentos');
  };

  if (loading || pLoading) return <LoadingPage />;

  return (
    <DocFormShell
      title={isEditing ? 'Editar orden de laboratorio' : 'Nueva orden de laboratorio'}
      patients={patients} patientId={patientId} setPatientId={setPatientId}
      date={date} setDate={setDate} error={error}
      isEditing={isEditing} saving={saving} onSubmit={handleSubmit} onDelete={handleDelete} docId={id}
    >
      <StudyListEditor studies={studies} setStudies={setStudies} label="Estudios solicitados" />
      <LabeledTextarea label="Indicaciones (opcional)" value={doctorNotes} onChange={setDoctorNotes} />
    </DocFormShell>
  );
}
```

- [ ] **Step 7: Crear OrdenImagenesForm**

Create `frontend/src/pages/Documentos/OrdenImagenesForm.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import { useClinicalDocumentMutations } from '../../hooks/useClinicalDocuments';
import { LoadingPage } from '../../components/ui/Spinner';
import { todayStr } from '../../utils/dateUtils';
import { DocFormShell, LabeledTextarea } from './DocFormShell';
import { StudyListEditor } from './StudyListEditor';

export function OrdenImagenesForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);
  const { patients, loading: pLoading } = usePatients();
  const { getDocument, createDocument, updateDocument, deleteDocument } = useClinicalDocumentMutations();

  const [patientId, setPatientId] = useState(searchParams.get('paciente') || '');
  const [date, setDate] = useState(todayStr());
  const [studies, setStudies] = useState<string[]>(['']);
  const [clinicalIndications, setClinicalIndications] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing || !id) return;
    getDocument(id).then((d) => {
      setPatientId(d.patientId); setDate(d.date);
      setStudies(d.studies?.length ? d.studies : ['']);
      setClinicalIndications(d.clinicalIndications || '');
      setDoctorNotes(d.doctorNotes || ''); setLoading(false);
    });
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { setError('Selecciona un paciente'); return; }
    setSaving(true);
    try {
      const payload = { type: 'orden_imagenes' as const, patientId, date, studies: studies.filter((s) => s.trim()), clinicalIndications, doctorNotes };
      if (isEditing && id) { await updateDocument(id, payload); navigate(-1); }
      else { const created = await createDocument(payload); navigate(`/documentos/${created._id}/imprimir`); }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!id || !confirm('¿Eliminar esta orden?')) return;
    await deleteDocument(id); navigate('/documentos');
  };

  if (loading || pLoading) return <LoadingPage />;

  return (
    <DocFormShell
      title={isEditing ? 'Editar orden de imágenes' : 'Nueva orden de imágenes'}
      patients={patients} patientId={patientId} setPatientId={setPatientId}
      date={date} setDate={setDate} error={error}
      isEditing={isEditing} saving={saving} onSubmit={handleSubmit} onDelete={handleDelete} docId={id}
    >
      <StudyListEditor studies={studies} setStudies={setStudies} label="Estudios solicitados" />
      <LabeledTextarea label="Indicaciones clínicas (opcional)" value={clinicalIndications} onChange={setClinicalIndications} />
      <LabeledTextarea label="Observaciones (opcional)" value={doctorNotes} onChange={setDoctorNotes} />
    </DocFormShell>
  );
}
```

- [ ] **Step 8: Verificar typecheck**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/pages/Documentos/RecetaForm.tsx frontend/src/pages/Documentos/CertificadoForm.tsx frontend/src/pages/Documentos/ReferimientoForm.tsx frontend/src/pages/Documentos/OrdenLaboratorioForm.tsx frontend/src/pages/Documentos/OrdenImagenesForm.tsx frontend/src/pages/Documentos/DocFormShell.tsx frontend/src/pages/Documentos/StudyListEditor.tsx
git commit -m "feat: formularios por tipo de documento clínico"
```

---

### Task 11: Lista de documentos + selector de tipo

**Files:**
- Create: `frontend/src/pages/Documentos/index.tsx`
- Create: `frontend/src/pages/Documentos/SelectorTipo.tsx`

**Interfaces:**
- Consumes: `useClinicalDocuments`, `usePatients`, `DOCUMENT_TYPE_META`, `DOCUMENT_TYPE_LIST`, `formatDate`.

- [ ] **Step 1: Crear la lista**

Create `frontend/src/pages/Documentos/index.tsx`:
```tsx
import { useNavigate } from 'react-router-dom';
import { useClinicalDocuments } from '../../hooks/useClinicalDocuments';
import { usePatients } from '../../hooks/usePatients';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingPage } from '../../components/ui/Spinner';
import { formatDate } from '../../utils/dateUtils';
import { DOCUMENT_TYPE_META } from '../../utils/documentTypes';
import { Plus, FileText, Printer } from 'lucide-react';

export function DocumentosPage() {
  const navigate = useNavigate();
  const { documents, loading } = useClinicalDocuments();
  const { patients } = usePatients();
  const patientName = (pid: string) => patients.find((p) => p._id === pid)?.name || 'Paciente';

  return (
    <div>
      <Header title="Documentos" actions={
        <Button size="sm" onClick={() => navigate('/documentos/nuevo')}><Plus size={16} /> Nuevo</Button>
      } />
      <div className="p-4 lg:p-6 space-y-3">
        {loading ? <LoadingPage /> : documents.length === 0 ? (
          <Card className="p-10 text-center">
            <FileText size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm mb-3">No hay documentos registrados</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/documentos/nuevo')}><Plus size={14} /> Crear documento</Button>
          </Card>
        ) : (
          documents.map((d) => (
            <Card key={d._id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/documentos/${d._id}/editar`)}>
                  <p className="font-medium text-slate-900">{patientName(d.patientId)}</p>
                  <p className="text-xs text-slate-500">{DOCUMENT_TYPE_META[d.type]?.short ?? 'Documento'} · {formatDate(d.date)}</p>
                </div>
                <button onClick={() => navigate(`/documentos/${d._id}/imprimir`)} className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition" title="Imprimir">
                  <Printer size={18} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear el selector de tipo**

Create `frontend/src/pages/Documentos/SelectorTipo.tsx`:
```tsx
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { DOCUMENT_TYPE_LIST, DOCUMENT_TYPE_META } from '../../utils/documentTypes';
import { FileText, ShieldCheck, ArrowRightCircle, FlaskConical, ScanLine } from 'lucide-react';
import type { DocumentType } from '../../db/schemas';

const ICONS: Record<DocumentType, typeof FileText> = {
  receta: FileText,
  certificado: ShieldCheck,
  referimiento: ArrowRightCircle,
  orden_laboratorio: FlaskConical,
  orden_imagenes: ScanLine,
};

export function SelectorTipo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paciente = searchParams.get('paciente');
  const suffix = paciente ? `?paciente=${paciente}` : '';

  return (
    <div>
      <Header title="Nuevo documento" />
      <div className="p-4 lg:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
        {DOCUMENT_TYPE_LIST.map((t) => {
          const Icon = ICONS[t];
          return (
            <Card key={t} className="p-5 cursor-pointer hover:border-sky-300 transition" onClick={() => navigate(`/documentos/nuevo/${t}${suffix}`)}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Icon size={20} className="text-sky-600" />
                </div>
                <span className="font-medium text-slate-900">{DOCUMENT_TYPE_META[t].label}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Documentos/index.tsx frontend/src/pages/Documentos/SelectorTipo.tsx
git commit -m "feat: lista unificada de documentos y selector de tipo"
```

---

### Task 12: Rutas y navegación

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/layout/Sidebar.tsx`

**Interfaces:**
- Consumes: componentes de Documentos (Tasks 9–11).
- El form correcto por tipo se resuelve con un componente despachador `DocumentoFormRouter` para `/documentos/:id/editar` (necesita cargar el doc para saber su tipo) y por `:tipo` para crear.

- [ ] **Step 1: Crear el despachador de formularios**

Create `frontend/src/pages/Documentos/DocumentoFormRouter.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getClinicalDocument } from '../../db/queries/clinicalDocuments';
import { resolveDocType } from '../../utils/documentTypes';
import { LoadingPage } from '../../components/ui/Spinner';
import type { DocumentType } from '../../db/schemas';
import { RecetaForm } from './RecetaForm';
import { CertificadoForm } from './CertificadoForm';
import { ReferimientoForm } from './ReferimientoForm';
import { OrdenLaboratorioForm } from './OrdenLaboratorioForm';
import { OrdenImagenesForm } from './OrdenImagenesForm';

const FORMS: Record<DocumentType, () => JSX.Element> = {
  receta: RecetaForm,
  certificado: CertificadoForm,
  referimiento: ReferimientoForm,
  orden_laboratorio: OrdenLaboratorioForm,
  orden_imagenes: OrdenImagenesForm,
};

// Crear: el tipo viene en la URL (/documentos/nuevo/:tipo)
export function DocumentoFormNuevo() {
  const { tipo } = useParams<{ tipo: string }>();
  const t = resolveDocType(tipo || '');
  if (!t) return <div className="p-6 text-slate-400">Tipo de documento no válido.</div>;
  const Form = FORMS[t];
  return <Form />;
}

// Editar: hay que cargar el doc para conocer su tipo (/documentos/:id/editar)
export function DocumentoFormEditar() {
  const { id } = useParams<{ id: string }>();
  const { clinicId } = useAuth();
  const [type, setType] = useState<DocumentType | null | 'loading'>('loading');

  useEffect(() => {
    if (!id) return;
    getClinicalDocument(clinicId!, id)
      .then((d) => setType(resolveDocType(d.type)))
      .catch(() => setType(null));
  }, [id, clinicId]);

  if (type === 'loading') return <LoadingPage />;
  if (!type) return <div className="p-6 text-slate-400">Documento no encontrado o tipo no válido.</div>;
  const Form = FORMS[type];
  return <Form />;
}
```

- [ ] **Step 2: Actualizar imports y rutas en App.tsx**

En `frontend/src/App.tsx`, reemplazar los imports de Recetas (líneas 16-18) por:
```tsx
import { DocumentosPage } from './pages/Documentos';
import { SelectorTipo } from './pages/Documentos/SelectorTipo';
import { DocumentoFormNuevo, DocumentoFormEditar } from './pages/Documentos/DocumentoFormRouter';
import { DocumentoPrint } from './pages/Documentos/DocumentoPrint';
```
Reemplazar la ruta de impresión sin shell (líneas 115-122) por:
```tsx
            <Route
              path="/documentos/:id/imprimir"
              element={
                <ProtectedRoute>
                  <DocumentoPrint />
                </ProtectedRoute>
              }
            />
```
Reemplazar las 3 rutas de recetas dentro del shell (líneas 142-144) por:
```tsx
                      <Route path="/documentos" element={<DocumentosPage />} />
                      <Route path="/documentos/nuevo" element={<SelectorTipo />} />
                      <Route path="/documentos/nuevo/:tipo" element={<DocumentoFormNuevo />} />
                      <Route path="/documentos/:id/editar" element={<DocumentoFormEditar />} />
```

- [ ] **Step 3: Actualizar el Sidebar**

En `frontend/src/components/layout/Sidebar.tsx`, línea 11, reemplazar:
```tsx
  { to: '/recetas', icon: FileText, label: 'Recetas' },
```
por:
```tsx
  { to: '/documentos', icon: FileText, label: 'Documentos' },
```

- [ ] **Step 4: Verificar typecheck + navegador**

Run: `npm run build`
Expected: PASS.
Luego `npm run dev`: el sidebar muestra "Documentos"; entrar → lista; "Nuevo" → selector con 5 tarjetas; crear un certificado → guarda y abre vista de impresión con header/firma; editar ese certificado carga sus datos; imprimir renderiza bien.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/components/layout/Sidebar.tsx frontend/src/pages/Documentos/DocumentoFormRouter.tsx
git commit -m "feat: rutas /documentos/* y navegación (reemplaza Recetas)"
```

---

### Task 13: Integrar Documentos en la ficha del paciente

**Files:**
- Modify: `frontend/src/pages/Pacientes/PacienteDetalle.tsx`

**Interfaces:**
- Consumes: `useClinicalDocumentsForPatient`, `DOCUMENT_TYPE_META`.

- [ ] **Step 1: Cambiar el hook y el tab**

En `frontend/src/pages/Pacientes/PacienteDetalle.tsx`:
- Reemplazar el import `usePrescriptionsForPatient` (línea 6) por:
```tsx
import { useClinicalDocumentsForPatient } from '../../hooks/useClinicalDocuments';
import { DOCUMENT_TYPE_META } from '../../utils/documentTypes';
```
- Reemplazar el tipo `Tab` (línea 21): `type Tab = 'citas' | 'tratamientos' | 'documentos';`
- Reemplazar el uso del hook (línea 30):
```tsx
  const { documents } = useClinicalDocumentsForPatient(id);
```
- Reemplazar la definición del tab (línea 46):
```tsx
    { id: 'documentos', label: 'Documentos', icon: FileText, count: documents.length },
```

- [ ] **Step 2: Reemplazar el bloque de render del tab**

Reemplazar todo el bloque `{activeTab === 'recetas' && ( ... )}` (líneas 217-248) por:
```tsx
        {activeTab === 'documentos' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => navigate(`/documentos/nuevo?paciente=${id}`)}>
                <Plus size={14} />
                Nuevo documento
              </Button>
            </div>
            {documents.length === 0 ? (
              <Card className="p-8 text-center text-slate-400 text-sm">Sin documentos registrados</Card>
            ) : (
              documents.map((d) => (
                <Card key={d._id} className="p-3" onClick={() => navigate(`/documentos/${d._id}/editar`)}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{formatDate(d.date)}</p>
                      <p className="text-xs text-slate-500">{DOCUMENT_TYPE_META[d.type]?.label ?? 'Documento'}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/documentos/${d._id}/imprimir`); }}
                      className="text-xs text-sky-600 hover:text-sky-800 font-medium px-2 py-1 rounded-md hover:bg-sky-50"
                    >
                      Imprimir
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
```

- [ ] **Step 3: Verificar que no quede referencia al tab viejo**

Run: `grep -n "recetas\|prescriptions" frontend/src/pages/Pacientes/PacienteDetalle.tsx`
Expected: sin resultados (o solo comentarios irrelevantes). Si el valor inicial de `activeTab` era `'recetas'`, cambiarlo a un tab válido existente.

- [ ] **Step 4: Verificar typecheck + navegador**

Run: `npm run build`
Expected: PASS.
Luego `npm run dev`: abrir un paciente → tab "Documentos" lista sus documentos; "Nuevo documento" preselecciona el paciente y al guardar aparece en su ficha.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Pacientes/PacienteDetalle.tsx
git commit -m "feat: ficha de paciente usa documentos clínicos unificados"
```

---

### Task 14: Migración de recetas existentes (TDD)

**Files:**
- Create: `frontend/src/db/migratePrescriptions.ts`
- Test: `frontend/src/db/migratePrescriptions.test.ts`
- Create: `frontend/scripts/run-migration.ts`

**Interfaces:**
- Produces:
  - `prescriptionToDocument(p: Prescription): Omit<ClinicalDocument, never>` — mapea una receta a un documento con `type: 'receta'`, preservando `_id`, timestamps y `deletedAt`.

- [ ] **Step 1: Escribir tests del mapeo que fallan**

Create `frontend/src/db/migratePrescriptions.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { prescriptionToDocument } from './migratePrescriptions';
import type { Prescription } from './schemas';

const sample: Prescription = {
  _id: 'prescription_abc',
  patientId: 'patient_1',
  appointmentId: 'appt_1',
  date: '2026-01-10',
  medications: [{ id: 'm1', name: 'Amoxicilina', dosage: '500mg', frequency: 'c/8h', duration: '7 días', instructions: '' }],
  doctorNotes: 'Reposo',
  createdAt: '2026-01-10T10:00:00.000Z',
  updatedAt: '2026-01-10T10:00:00.000Z',
  deletedAt: null,
};

describe('prescriptionToDocument', () => {
  it('conserva el id y marca type receta', () => {
    const d = prescriptionToDocument(sample);
    expect(d._id).toBe('prescription_abc');
    expect(d.type).toBe('receta');
  });
  it('conserva medicamentos, notas, fecha y timestamps', () => {
    const d = prescriptionToDocument(sample);
    expect(d.medications).toHaveLength(1);
    expect(d.doctorNotes).toBe('Reposo');
    expect(d.date).toBe('2026-01-10');
    expect(d.createdAt).toBe('2026-01-10T10:00:00.000Z');
    expect(d.deletedAt).toBeNull();
  });
  it('conserva el estado de borrado', () => {
    const d = prescriptionToDocument({ ...sample, deletedAt: '2026-02-01T00:00:00.000Z' });
    expect(d.deletedAt).toBe('2026-02-01T00:00:00.000Z');
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm run test`
Expected: FAIL — módulo `./migratePrescriptions` inexistente.

- [ ] **Step 3: Implementar el mapeo**

Create `frontend/src/db/migratePrescriptions.ts`:
```ts
import type { Prescription, ClinicalDocument } from './schemas';

export function prescriptionToDocument(p: Prescription): ClinicalDocument {
  return {
    _id: p._id,
    type: 'receta',
    patientId: p.patientId,
    appointmentId: p.appointmentId,
    date: p.date,
    medications: p.medications,
    doctorNotes: p.doctorNotes,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    deletedAt: p.deletedAt,
  };
}
```

- [ ] **Step 4: Correr y verificar verde**

Run: `npm run test`
Expected: PASS (3 tests nuevos).

- [ ] **Step 5: Crear el script ejecutable**

Create `frontend/scripts/run-migration.ts`:
```ts
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
```

- [ ] **Step 6: Verificar typecheck del script**

Run: `npx tsc --noEmit scripts/run-migration.ts` (o `npm run build`)
Expected: sin errores de tipos. (No se ejecuta la migración aquí — requiere credenciales y decisión del usuario sobre qué clínicas migrar.)

- [ ] **Step 7: Commit**

```bash
git add frontend/src/db/migratePrescriptions.ts frontend/src/db/migratePrescriptions.test.ts frontend/scripts/run-migration.ts
git commit -m "feat: migración de recetas a clinicalDocuments (mapeo TDD + script)"
```

---

### Task 15: Limpiar el módulo viejo de Recetas

**Files:**
- Delete: `frontend/src/pages/Recetas/` (index.tsx, RecetaForm.tsx, RecetaPrint.tsx)
- Delete: `frontend/src/db/queries/prescriptions.ts`
- Delete: `frontend/src/hooks/usePrescriptions.ts`

**Precondición:** Tasks 12 y 13 completas (ningún consumidor referencia lo viejo).

- [ ] **Step 1: Verificar que no queden referencias**

Run:
```bash
grep -rn "usePrescriptions\|queries/prescriptions\|pages/Recetas\|RecetaPrint\|RecetasPage" frontend/src --include=*.ts --include=*.tsx
```
Expected: sin resultados. Si aparece alguno, corregir ese consumidor antes de borrar.

- [ ] **Step 2: Borrar los archivos**

Run:
```bash
git rm -r frontend/src/pages/Recetas frontend/src/db/queries/prescriptions.ts frontend/src/hooks/usePrescriptions.ts
```

- [ ] **Step 3: Verificar typecheck + tests + navegador**

Run: `npm run build && npm run test`
Expected: ambos PASS.
Luego `npm run dev`: navegar por Documentos (crear/editar/imprimir cada tipo) y por la ficha del paciente confirma que nada se rompió.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: eliminar módulo Recetas reemplazado por Documentos"
```

---

## Self-Review

**1. Cobertura del spec:**
- 4 tipos nuevos + receta → Tasks 9, 10 (forms), 9 (prints). ✅
- Sección "Documentos" unificada → Tasks 11, 12. ✅
- Guardado en historial (Firestore) → Tasks 4, 5. ✅
- Logo/firma/sello reales + Storage → Tasks 6, 7, 8. ✅
- Número de licencia → Tasks 2, 7, 8. ✅
- Migración sin borrar `prescriptions` → Task 14; borrado de código viejo (no de datos) → Task 15. ✅
- Contenido genérico de texto libre → forms sin presets (Task 10). ✅
- Fallback a firma a mano sin branding → `PrintSignature` (Task 8). ✅
- Manejo de tipo desconocido en impresión/edición → `DocumentoPrint`, `DocumentoFormEditar`. ✅
- Reglas de Storage → Task 6. ✅
- Verificación (spec decía QA manual; el usuario pidió tests que yo mismo corra) → Vitest en Tasks 1, 3, 6, 14 + build por tarea. ✅

**2. Placeholders:** ninguno — todos los pasos con código muestran el código completo.

**3. Consistencia de tipos:** hooks exponen `createDocument/updateDocument/getDocument/deleteDocument` (Task 5) y así se consumen en todos los forms (Task 10). `ClinicalDocument`, `DocumentType`, `Referral` definidos en Task 2 y usados consistentemente. `resolveDocType`/`DOCUMENT_TYPE_META`/`DOCUMENT_TYPE_LIST` definidos en Task 3 y usados en Tasks 9, 11, 12, 13. `BrandingKind`/`uploadBranding`/`validateBrandingImage` definidos en Task 6 y usados en Task 7.

**Nota sobre `JSX.Element`:** en `DocumentoFormRouter.tsx` y `DocumentoPrint.tsx` se usa el tipo `JSX.Element` en el Record de componentes. Si el proyecto no tiene `JSX` global disponible, cambiar la anotación a `React.FC` importando `type { FC } from 'react'` — verificar en Task 12 Step 4 (`npm run build`) y ajustar si `tsc` se queja.
