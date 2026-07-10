import type { ClinicalDocument, Patient, ClinicConfig } from '../../../db/schemas';
import { PrintPatientRow } from './PrintPatientRow';

export function CertificadoPrint({ doc, patient }: { doc: ClinicalDocument; patient: Patient; config: ClinicConfig | null }) {
  return (
    <>
      <h2 style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '0.08em', color: '#0f172a', marginBottom: '24px' }}>CERTIFICADO MÉDICO</h2>
      <PrintPatientRow patient={patient} date={doc.date} />
      <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.7 }}>
        Certifico que <strong>{patient.name}</strong> ha sido evaluado(a) en esta consulta
        {doc.reason ? `, con motivo de: ${doc.reason}.` : '.'}
        {doc.restDays ? ` Se recomienda reposo médico por ${doc.restDays} día(s).` : ''}
      </p>
      {doc.doctorNotes && (
        <p style={{ marginTop: '16px', fontSize: '13px', color: '#475569' }}>{doc.doctorNotes}</p>
      )}
    </>
  );
}
