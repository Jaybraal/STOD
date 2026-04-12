import type { AppointmentStatus, TreatmentStatus, ClinicType, CustomField } from '../db/schemas';

// Colores por estado de cita
export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  programada: 'bg-sky-100 text-sky-800',
  completada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
  no_asistio: 'bg-slate-100 text-slate-600',
};

export const APPOINTMENT_STATUS_CALENDAR: Record<AppointmentStatus, string> = {
  programada: '#0ea5e9',
  completada: '#22c55e',
  cancelada: '#ef4444',
  no_asistio: '#94a3b8',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  programada: 'Programada',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_asistio: 'No asistió',
};

export const TREATMENT_STATUS_COLORS: Record<TreatmentStatus, string> = {
  planificado: 'bg-amber-100 text-amber-800',
  en_proceso: 'bg-sky-100 text-sky-800',
  completado: 'bg-green-100 text-green-800',
};

export const TREATMENT_STATUS_LABELS: Record<TreatmentStatus, string> = {
  planificado: 'Planificado',
  en_proceso: 'En proceso',
  completado: 'Completado',
};

// Piezas dentales - Notación FDI
export const TEETH_FDI: { value: string; label: string }[] = [
  // Cuadrante 1 (superior derecho)
  { value: '1.8', label: '1.8 - Tercer molar sup. der.' },
  { value: '1.7', label: '1.7 - Segundo molar sup. der.' },
  { value: '1.6', label: '1.6 - Primer molar sup. der.' },
  { value: '1.5', label: '1.5 - Segundo premolar sup. der.' },
  { value: '1.4', label: '1.4 - Primer premolar sup. der.' },
  { value: '1.3', label: '1.3 - Canino sup. der.' },
  { value: '1.2', label: '1.2 - Incisivo lateral sup. der.' },
  { value: '1.1', label: '1.1 - Incisivo central sup. der.' },
  // Cuadrante 2 (superior izquierdo)
  { value: '2.1', label: '2.1 - Incisivo central sup. izq.' },
  { value: '2.2', label: '2.2 - Incisivo lateral sup. izq.' },
  { value: '2.3', label: '2.3 - Canino sup. izq.' },
  { value: '2.4', label: '2.4 - Primer premolar sup. izq.' },
  { value: '2.5', label: '2.5 - Segundo premolar sup. izq.' },
  { value: '2.6', label: '2.6 - Primer molar sup. izq.' },
  { value: '2.7', label: '2.7 - Segundo molar sup. izq.' },
  { value: '2.8', label: '2.8 - Tercer molar sup. izq.' },
  // Cuadrante 3 (inferior izquierdo)
  { value: '3.8', label: '3.8 - Tercer molar inf. izq.' },
  { value: '3.7', label: '3.7 - Segundo molar inf. izq.' },
  { value: '3.6', label: '3.6 - Primer molar inf. izq.' },
  { value: '3.5', label: '3.5 - Segundo premolar inf. izq.' },
  { value: '3.4', label: '3.4 - Primer premolar inf. izq.' },
  { value: '3.3', label: '3.3 - Canino inf. izq.' },
  { value: '3.2', label: '3.2 - Incisivo lateral inf. izq.' },
  { value: '3.1', label: '3.1 - Incisivo central inf. izq.' },
  // Cuadrante 4 (inferior derecho)
  { value: '4.1', label: '4.1 - Incisivo central inf. der.' },
  { value: '4.2', label: '4.2 - Incisivo lateral inf. der.' },
  { value: '4.3', label: '4.3 - Canino inf. der.' },
  { value: '4.4', label: '4.4 - Primer premolar inf. der.' },
  { value: '4.5', label: '4.5 - Segundo premolar inf. der.' },
  { value: '4.6', label: '4.6 - Primer molar inf. der.' },
  { value: '4.7', label: '4.7 - Segundo molar inf. der.' },
  { value: '4.8', label: '4.8 - Tercer molar inf. der.' },
];

export const APPOINTMENT_DURATIONS = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora 30 min' },
  { value: 120, label: '2 horas' },
];

export const API_URL = import.meta.env.VITE_API_URL ?? '';

// Tipos de clínica disponibles
export const CLINIC_TYPE_OPTIONS: { value: ClinicType; label: string; emoji: string }[] = [
  { value: 'dental',       label: 'Odontología / Dental',       emoji: '🦷' },
  { value: 'medicina',     label: 'Medicina General',           emoji: '🩺' },
  { value: 'psicologia',   label: 'Psicología',                 emoji: '🧠' },
  { value: 'fisioterapia', label: 'Fisioterapia / Rehabilitación', emoji: '💪' },
  { value: 'nutricion',    label: 'Nutrición / Dietética',      emoji: '🥗' },
  { value: 'veterinaria',  label: 'Veterinaria',                emoji: '🐾' },
  { value: 'otro',         label: 'Otro tipo de consultorio',   emoji: '🏥' },
];

// Campos de tratamiento por defecto según tipo de clínica
export const DEFAULT_TREATMENT_FIELDS: Record<ClinicType, CustomField[]> = {
  dental: [
    {
      id: 'tooth',
      label: 'Pieza dental (FDI)',
      type: 'select',
      placeholder: 'Seleccionar...',
      options: TEETH_FDI.map((t) => t.value),
      required: false,
    },
  ],
  medicina: [
    { id: 'diagnostico', label: 'Diagnóstico / CIE-10', type: 'text', placeholder: 'Ej: J06 - Infección respiratoria', required: false },
    { id: 'zona',        label: 'Zona / Área corporal', type: 'text', placeholder: 'Ej: Zona lumbar', required: false },
  ],
  psicologia: [
    { id: 'sesion',       label: 'N.º de sesión',         type: 'number', placeholder: '1', required: false },
    { id: 'modalidad',    label: 'Modalidad',             type: 'select', options: ['Presencial', 'Online', 'Grupal'], required: false },
  ],
  fisioterapia: [
    { id: 'zona',         label: 'Zona corporal',          type: 'text', placeholder: 'Ej: Hombro derecho', required: false },
    { id: 'sesion',       label: 'N.º de sesión',          type: 'number', placeholder: '1', required: false },
  ],
  nutricion: [
    { id: 'peso',         label: 'Peso (kg)',               type: 'number', placeholder: '70', required: false },
    { id: 'imc',          label: 'IMC',                     type: 'number', placeholder: '22.5', required: false },
  ],
  veterinaria: [
    { id: 'especie',      label: 'Especie',                 type: 'select', options: ['Perro', 'Gato', 'Ave', 'Conejo', 'Reptil', 'Otro'], required: false },
    { id: 'raza',         label: 'Raza',                    type: 'text', placeholder: 'Ej: Golden Retriever', required: false },
  ],
  otro: [],
};
