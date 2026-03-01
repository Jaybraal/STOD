// Base document que todos los docs de PouchDB comparten
export interface BaseDoc {
  _id: string;
  _rev?: string;
  type: 'patient' | 'appointment' | 'treatment' | 'prescription' | 'config';
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  deletedAt?: string; // soft delete
}

// Paciente
export interface Patient extends BaseDoc {
  type: 'patient';
  name: string;
  dob: string; // YYYY-MM-DD
  phone: string;
  email: string;
  address: string;
  allergies: string;
  medicalHistory: string;
  notes: string;
}

// Estados posibles de una cita
export type AppointmentStatus = 'programada' | 'completada' | 'cancelada' | 'no_asistio';

// Cita
export interface Appointment extends BaseDoc {
  type: 'appointment';
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
  type: 'treatment';
  patientId: string;
  tooth: string;        // Notación FDI: "1.1", "2.8", etc.
  procedure: string;
  status: TreatmentStatus;
  cost: number;
  notes: string;
  startDate: string;
  endDate: string;
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
  type: 'prescription';
  patientId: string;
  appointmentId: string;
  date: string; // YYYY-MM-DD
  medications: Medication[];
  doctorNotes: string;
}

// Configuración de la clínica
export interface ClinicConfig extends BaseDoc {
  type: 'config';
  _id: 'config_clinic';
  clinicName: string;
  doctorName: string;
  phone: string;
  address: string;
  // Sync
  syncCode: string | null;
  syncUrl: string | null;
  syncUsername: string | null;
  syncPassword: string | null;
}

// Tipos de cualquier documento
export type AnyDoc = Patient | Appointment | Treatment | Prescription | ClinicConfig;
