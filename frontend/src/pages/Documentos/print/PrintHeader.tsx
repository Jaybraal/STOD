import type { ClinicConfig } from '../../../db/schemas';

export function PrintHeader({ config }: { config: ClinicConfig | null }) {
  return (
    <div style={{ borderBottom: '2px solid #0ea5e9', paddingBottom: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      {config?.logoUrl && (
        <img src={config.logoUrl} alt="Logo" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
      )}
      <div>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>
          {config?.clinicName || 'Clínica'}
        </h1>
        {config?.doctorName && (
          <p style={{ margin: '4px 0 0', fontSize: '16px', color: '#64748b' }}>Dr. {config.doctorName}</p>
        )}
        {config?.phone && (
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>Tel. {config.phone}</p>
        )}
        {config?.address && (
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#94a3b8' }}>{config.address}</p>
        )}
      </div>
    </div>
  );
}
