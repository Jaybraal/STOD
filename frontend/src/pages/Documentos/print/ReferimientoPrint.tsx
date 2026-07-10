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
