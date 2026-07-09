# Documentos profesionales — Diseño

**Fecha:** 2026-07-08
**Proyecto:** STOD (Sistema de Odontología)
**Alcance:** Bloque 1 de 2 (el bloque 2, "Agenda inteligente", se diseña en sesión aparte)

## Contexto

Inspirado en capturas de marketing de "YGM Health". STOD ya tiene un módulo de
**Recetas** (`pages/Recetas/`, colección Firestore `prescriptions`) con formulario e
impresión. Este spec extiende esa base para cubrir cuatro tipos de documento clínico
adicionales y agrega branding real (logo, firma, sello) a los documentos generados.

STOD es un consultorio dental, pero por decisión del usuario los documentos son de
**contenido genérico con campos de texto libre** (sin presets dentales): el doctor
escribe lo que necesite en cada campo.

## Objetivos

1. Agregar 4 tipos de documento nuevos: **certificado médico, referimiento médico,
   orden de laboratorio, orden de imágenes diagnósticas**.
2. Unificar Recetas + los 4 nuevos bajo una sección única **"Documentos"**.
3. Cada documento se **guarda en el historial** (persistente en Firestore, asociado al
   paciente), reimprimible.
4. Documentos personalizados con **logo, firma y sello reales** (imágenes subidas por
   el doctor en Configuración) + número de licencia.

## No-objetivos (YAGNI)

- No se introduce un framework de tests automatizados solo para esto (STOD no tiene
  tests de frontend hoy). Verificación manual vía `/qa`.
- No se borra la colección vieja `prescriptions` (queda de respaldo tras migrar).
- No se agregan presets/plantillas de contenido específicas de odontología.
- No cubre el bloque "Agenda inteligente" (recordatorios, check-in, sala de espera).

## Modelo de datos

Nueva colección: `clinics/{clinicId}/clinicalDocuments`

```ts
type DocumentType =
  | 'receta'
  | 'certificado'
  | 'referimiento'
  | 'orden_laboratorio'
  | 'orden_imagenes';

interface ClinicalDocument extends BaseDoc {
  type: DocumentType;
  patientId: string;
  date: string;                 // ISO date
  doctorNotes?: string;         // indicaciones / notas, común a todos

  // receta
  medications?: Medication[];

  // certificado
  restDays?: number;
  reason?: string;

  // referimiento
  referredTo?: { name: string; specialty?: string };
  clinicalSummary?: string;

  // orden_laboratorio / orden_imagenes
  studies?: string[];

  // orden_imagenes
  clinicalIndications?: string;
}
```

`Medication` ya existe en `db/schemas.ts` y se reutiliza tal cual.

Los campos por tipo son opcionales en el modelo; cada formulario decide cuáles llena.
No hay validación cruzada de "este tipo exige este campo" a nivel de schema — la
completitud se valida en cada formulario.

### Queries — `db/queries/clinicalDocuments.ts`

Mismo patrón CRUD que `prescriptions.ts`:

- `getClinicalDocument(clinicId, id)`
- `listClinicalDocuments(clinicId)` — devuelve todos, filtrando `deletedAt === null`
- `createClinicalDocument(clinicId, data)`
- `updateClinicalDocument(clinicId, id, data)`
- `deleteClinicalDocument(clinicId, id)` — soft delete (`deletedAt`)

### Migración — `scripts/migrate-prescriptions.ts`

Script de una sola ejecución manual:

1. Lee todos los docs de `clinics/{clinicId}/prescriptions`.
2. Por cada uno, escribe en `clinicalDocuments` con **mismo ID** y `type: 'receta'`,
   preservando `date`, `createdAt`, `updatedAt`, `medications`, `doctorNotes`,
   `patientId`, `deletedAt`.
3. Idempotente: si el doc destino ya existe con el mismo ID, lo omite.
4. **No borra** `prescriptions`.

Debe correr por cada clínica existente (recibe/itera `clinicId`).

## Navegación y pantallas

- **Sidebar:** item "Recetas" → **"Documentos"**, ruta `/recetas` → `/documentos`.
- `pages/Documentos/index.tsx` — lista unificada de todos los tipos: ícono + badge de
  tipo, nombre del paciente, fecha, botón imprimir. Botón "Nuevo".
- `pages/Documentos/SelectorTipo.tsx` (`/documentos/nuevo`) — 5 tarjetas para elegir
  tipo, navega a `/documentos/nuevo/:tipo`.
- Formularios (`/documentos/nuevo/:tipo`, `/documentos/:id/editar`) — un archivo por
  tipo:
  - `RecetaForm.tsx` (migrado/renombrado del actual)
  - `CertificadoForm.tsx`
  - `ReferimientoForm.tsx`
  - `OrdenLaboratorioForm.tsx`
  - `OrdenImagenesForm.tsx`
  - Al editar, se resuelve el form por el `type` del documento cargado.
- Impresión (`/documentos/:id/imprimir`) — un archivo por tipo:
  - `RecetaPrint.tsx` (migrado del actual)
  - `CertificadoPrint.tsx`, `ReferimientoPrint.tsx`,
    `OrdenLaboratorioPrint.tsx`, `OrdenImagenesPrint.tsx`
  - Un componente router de impresión resuelve el `type` y renderiza la plantilla.

### Componentes compartidos de impresión

Para no repetir el encabezado/firma en las 5 plantillas:

- `PrintHeader` — logo (si existe) + nombre clínica + doctor + tel + dirección.
- `PrintSignature` — imagen de firma (si existe) sobre la línea, nombre del doctor,
  número de licencia, e imagen de sello (si existe). Fallback: línea en blanco para
  firmar a mano (comportamiento actual).

## Configuración — branding (logo, firma, sello)

Nueva sub-sección en `pages/Configuracion/index.tsx`: subir 3 imágenes independientes.

- Formatos: PNG / JPG. Tamaño máx: **2 MB** por imagen. Validación (tipo + tamaño)
  antes de subir, con mensaje de error claro si falla.
- Almacenamiento: **Firebase Storage** (integración nueva — STOD hoy solo usa
  Firestore). Rutas:
  - `clinics/{clinicId}/branding/logo`
  - `clinics/{clinicId}/branding/signature`
  - `clinics/{clinicId}/branding/stamp`
- Tras subir, se guarda la `downloadURL` en `ClinicConfig`.

### Cambios a `ClinicConfig`

```ts
interface ClinicConfig {
  // ...campos actuales...
  logoUrl?: string;
  signatureUrl?: string;
  stampUrl?: string;
  licenseNumber?: string;   // exequátur / licencia — se muestra bajo la firma
}
```

## Manejo de errores

- Subida de imagen: validar tipo y tamaño antes de subir; mostrar error legible.
- Impresión con `type` desconocido (dato corrupto/futuro): mensaje de fallback, no crash.
- Falta de `patient` o `config` al imprimir: se mantiene el loading state actual.
- Documento sin branding subido: se usa el fallback de firma a mano (no rompe nada).

## Pruebas / verificación

Manual con `/qa` una vez implementado, cubriendo por cada tipo:
crear → editar → imprimir, en dos variantes (con logo/firma/sello subidos y sin ellos).

## Reglas de seguridad Firestore/Storage

Las reglas de Storage deben restringir lectura/escritura de `clinics/{clinicId}/branding/*`
al usuario autenticado de esa clínica, siguiendo el patrón de las reglas de Firestore
existentes. (Detalle a resolver en el plan de implementación.)
