// Base document
export interface BaseDoc {
  _id: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  deletedAt: string | null; // null = activo, string ISO = eliminado (soft delete)
}

// Paciente
export interface Patient extends BaseDoc {
  name: string;
  dob: string; // YYYY-MM-DD
  phone: string;
  email: string;
  address: string;
  allergies: string;
  medicalHistory: string;
  notes: string;
  hasInsurance: boolean;
  insuranceProvider: string; // Nombre de la aseguradora, vacío si no aplica
}

// Estados posibles de una cita
export type AppointmentStatus = 'programada' | 'completada' | 'cancelada' | 'no_asistio';

// Cita
export interface Appointment extends BaseDoc {
  patientId: string;
  date: string;     // YYYY-MM-DD
  time: string;     // HH:mm
  duration: number; // minutos: 15, 30, 45, 60
  reason: string;
  status: AppointmentStatus;
  notes: string;
}

// Estados posibles de un tratamiento
export type TreatmentStatus = 'planificado' | 'en_proceso' | 'completado';

// Tratamiento
export interface Treatment extends BaseDoc {
  patientId: string;
  tooth?: string;       // Legado odontología — usar customData para nuevos campos
  procedure: string;
  status: TreatmentStatus;
  cost: number;
  notes: string;
  startDate: string;
  endDate: string;
  customData?: Record<string, string | number>; // Campos personalizados del tipo de clínica
}

// Medicamento dentro de una receta
export interface Medication {
  id: string;
  name: string;
  dosage: string;       // "500mg"
  frequency: string;   // "cada 8 horas"
  duration: string;    // "7 días"
  instructions: string; // "Tomar con alimentos"
}

// Receta
export interface Prescription extends BaseDoc {
  patientId: string;
  appointmentId: string;
  date: string; // YYYY-MM-DD
  medications: Medication[];
  doctorNotes: string;
}

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

// Tipo de clínica
export type ClinicType =
  | 'dental'
  | 'medicina'
  | 'psicologia'
  | 'fisioterapia'
  | 'nutricion'
  | 'veterinaria'
  | 'otro';

// Tipos de campo personalizado
export type CustomFieldType = 'text' | 'number' | 'select' | 'textarea';

// Definición de un campo personalizado en el formulario de tratamiento
export interface CustomField {
  id: string;
  label: string;
  type: CustomFieldType;
  placeholder?: string;
  options?: string[];   // Solo para type === 'select'
  required: boolean;
}

// Configuración de la clínica
export interface ClinicConfig {
  clinicName: string;
  doctorName: string;
  phone: string;
  address: string;
  joinCode?: string;              // Código de invitación para unir dispositivos
  clinicType?: ClinicType;        // Tipo de clínica seleccionado
  treatmentFields?: CustomField[]; // Campos personalizados del formulario de tratamiento
  logoUrl?: string;
  signatureUrl?: string;
  stampUrl?: string;
  licenseNumber?: string;   // exequátur / licencia — se muestra bajo la firma
}
