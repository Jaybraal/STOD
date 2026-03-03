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
  patientId: string;
  appointmentId: string;
  date: string; // YYYY-MM-DD
  medications: Medication[];
  doctorNotes: string;
}

// Configuración de la clínica
export interface ClinicConfig {
  clinicName: string;
  doctorName: string;
  phone: string;
  address: string;
  joinCode?: string; // Código de invitación para unir dispositivos
}
