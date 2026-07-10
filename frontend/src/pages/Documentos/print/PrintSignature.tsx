import type { ClinicConfig } from '../../../db/schemas';

export function PrintSignature({ config }: { config: ClinicConfig | null }) {
  return (
    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        {config?.signatureUrl
          ? <img src={config.signatureUrl} alt="Firma" style={{ height: '48px', objectFit: 'contain', marginBottom: '4px' }} />
          : <div style={{ borderBottom: '1px solid #0f172a', height: '48px', marginBottom: '8px' }} />}
        <div style={{ borderTop: config?.signatureUrl ? '1px solid #0f172a' : 'none', paddingTop: '4px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Firma del médico</p>
          {config?.doctorName && (
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>Dr. {config.doctorName}</p>
          )}
          {config?.licenseNumber && (
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>{config.licenseNumber}</p>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        {config?.stampUrl
          ? <img src={config.stampUrl} alt="Sello" style={{ height: '72px', objectFit: 'contain' }} />
          : <div style={{ borderBottom: '1px solid #0f172a', height: '48px', marginBottom: '8px' }} />}
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>Sello</p>
      </div>
    </div>
  );
}
