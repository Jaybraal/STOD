import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPrescription } from '../../db/queries/prescriptions';
import { getPatient } from '../../db/queries/patients';
import { getConfig } from '../../db/queries/config';
import type { Prescription, Patient, ClinicConfig } from '../../db/schemas';
import { formatDate } from '../../utils/dateUtils';
import { Printer, ArrowLeft } from 'lucide-react';

export function RecetaPrint() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clinicId } = useAuth();
  const [rx, setRx] = useState<Prescription | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [config, setConfig] = useState<ClinicConfig | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getPrescription(clinicId!, id), getConfig(clinicId!)]).then(async ([rxData, cfg]) => {
      setRx(rxData);
      setConfig(cfg);
      const pt = await getPatient(clinicId!, rxData.patientId);
      setPatient(pt);
    });
  }, [id, clinicId]);

  if (!rx || !patient) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-400">
        Cargando receta...
      </div>
    );
  }

  return (
    <>
      {/* Controles de impresión (se ocultan al imprimir) */}
      <div className="no-print fixed top-0 left-0 right-0 bg-slate-800 text-white px-4 py-3 flex items-center gap-3 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
        <div className="flex-1" />
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Printer size={16} />
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* Contenido imprimible */}
      <div
        id="print-area"
        style={{
          maxWidth: '700px',
          margin: '80px auto 40px',
          padding: '40px',
          backgroundColor: '#fff',
          fontFamily: 'Georgia, serif',
        }}
      >
        {/* Encabezado */}
        <div style={{ borderBottom: '2px solid #0ea5e9', paddingBottom: '20px', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>
            {config?.clinicName || 'Clínica Dental'}
          </h1>
          {config?.doctorName && (
            <p style={{ margin: '4px 0 0', fontSize: '16px', color: '#64748b' }}>
              Dr. {config.doctorName}
            </p>
          )}
          {config?.phone && (
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Tel. {config.phone}
            </p>
          )}
          {config?.address && (
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#94a3b8' }}>
              {config.address}
            </p>
          )}
        </div>

        {/* Info paciente y fecha */}
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
            <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{formatDate(rx.date)}</p>
          </div>
        </div>

        {/* Rx symbol */}
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#0ea5e9', fontStyle: 'italic' }}>Rx</span>
        </div>

        {/* Medicamentos */}
        <div style={{ marginBottom: '28px' }}>
          {rx.medications.map((med, idx) => (
            <div
              key={med.id}
              style={{
                marginBottom: '16px',
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                pageBreakInside: 'avoid',
              }}
            >
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                {idx + 1}. {med.name}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569' }}>
                {med.dosage} — {med.frequency}
                {med.duration ? ` por ${med.duration}` : ''}
              </p>
              {med.instructions && (
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                  * {med.instructions}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Indicaciones */}
        {rx.doctorNotes && (
          <div style={{ marginBottom: '40px', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
              Indicaciones
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>{rx.doctorNotes}</p>
          </div>
        )}

        {/* Firma */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <div style={{ borderBottom: '1px solid #0f172a', height: '40px', marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textAlign: 'center' }}>Firma del médico</p>
            {config?.doctorName && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                Dr. {config.doctorName}
              </p>
            )}
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #0f172a', height: '40px', marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textAlign: 'center' }}>Sello</p>
          </div>
        </div>

        <p style={{ marginTop: '20px', fontSize: '10px', color: '#cbd5e1', textAlign: 'center' }}>
          Este documento fue generado por STOD — Sistema de Odontología
        </p>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          #print-area { margin: 0 auto !important; padding: 20px !important; }
          body { background: white; }
        }
      `}</style>
    </>
  );
}
