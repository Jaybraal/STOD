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
