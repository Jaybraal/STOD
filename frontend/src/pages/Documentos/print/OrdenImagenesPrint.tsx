import type { ClinicalDocument, Patient, ClinicConfig } from '../../../db/schemas';
import { PrintPatientRow } from './PrintPatientRow';

export function OrdenImagenesPrint({ doc, patient }: { doc: ClinicalDocument; patient: Patient; config: ClinicConfig | null }) {
  const studies = doc.studies ?? [];
  return (
    <>
      <h2 style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '0.08em', color: '#0f172a', marginBottom: '24px' }}>ORDEN DE IMÁGENES DIAGNÓSTICAS</h2>
      <PrintPatientRow patient={patient} date={doc.date} />
      <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Estudio solicitado</p>
      <ul style={{ margin: 0, paddingLeft: '18px' }}>
        {studies.map((s, i) => (
          <li key={i} style={{ fontSize: '14px', color: '#334155', marginBottom: '6px' }}>{s}</li>
        ))}
      </ul>
      {doc.clinicalIndications && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Indicaciones clínicas</p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569' }}>{doc.clinicalIndications}</p>
        </div>
      )}
      {doc.doctorNotes && (
        <p style={{ marginTop: '16px', fontSize: '13px', color: '#475569' }}>{doc.doctorNotes}</p>
      )}
    </>
  );
}
