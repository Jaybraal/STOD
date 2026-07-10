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
