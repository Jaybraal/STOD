import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getClinicalDocument } from '../../db/queries/clinicalDocuments';
import { getPatient } from '../../db/queries/patients';
import { getConfig } from '../../db/queries/config';
import type { ClinicalDocument, Patient, ClinicConfig } from '../../db/schemas';
import { PrintHeader } from './print/PrintHeader';
import { PrintSignature } from './print/PrintSignature';
import { RecetaPrint } from './print/RecetaPrint';
import { CertificadoPrint } from './print/CertificadoPrint';
import { ReferimientoPrint } from './print/ReferimientoPrint';
import { OrdenLaboratorioPrint } from './print/OrdenLaboratorioPrint';
import { OrdenImagenesPrint } from './print/OrdenImagenesPrint';
import { Printer, ArrowLeft } from 'lucide-react';

const BODIES = {
  receta: RecetaPrint,
  certificado: CertificadoPrint,
  referimiento: ReferimientoPrint,
  orden_laboratorio: OrdenLaboratorioPrint,
  orden_imagenes: OrdenImagenesPrint,
} as const;

export function DocumentoPrint() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clinicId } = useAuth();
  const [doc, setDoc] = useState<ClinicalDocument | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [config, setConfig] = useState<ClinicConfig | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getClinicalDocument(clinicId!, id), getConfig(clinicId!)]).then(async ([d, cfg]) => {
      setDoc(d);
      setConfig(cfg);
      setPatient(await getPatient(clinicId!, d.patientId));
    });
  }, [id, clinicId]);

  if (!doc || !patient) {
    return <div className="flex items-center justify-center h-screen text-slate-400">Cargando documento...</div>;
  }

  const Body = BODIES[doc.type];
  if (!Body) {
    return <div className="flex items-center justify-center h-screen text-slate-400">Tipo de documento no reconocido.</div>;
  }

  return (
    <>
      <div className="no-print fixed top-0 left-0 right-0 bg-slate-800 text-white px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex-1" />
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Printer size={16} /> Imprimir / Guardar PDF
        </button>
      </div>

      <div id="print-area" style={{ maxWidth: '700px', margin: '80px auto 40px', padding: '40px', backgroundColor: '#fff', fontFamily: 'Georgia, serif' }}>
        <PrintHeader config={config} />
        <Body doc={doc} patient={patient} config={config} />
        <PrintSignature config={config} />
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
