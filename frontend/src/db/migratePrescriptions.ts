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
