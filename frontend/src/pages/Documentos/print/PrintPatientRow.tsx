import type { Patient } from '../../../db/schemas';
import { formatDate } from '../../../utils/dateUtils';

export function PrintPatientRow({ patient, date }: { patient: Patient; date: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
      <div>
        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paciente</p>
        <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{patient.name}</p>
        {patient.dob && (
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
            Fecha nacimiento: {formatDate(patient.dob)}
          </p>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</p>
        <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{formatDate(date)}</p>
      </div>
    </div>
  );
}
