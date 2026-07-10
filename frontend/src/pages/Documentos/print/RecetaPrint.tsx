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
