import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getClinicalDocument } from '../../db/queries/clinicalDocuments';
import { resolveDocType } from '../../utils/documentTypes';
import { LoadingPage } from '../../components/ui/Spinner';
import type { DocumentType } from '../../db/schemas';
import { RecetaForm } from './RecetaForm';
import { CertificadoForm } from './CertificadoForm';
import { ReferimientoForm } from './ReferimientoForm';
import { OrdenLaboratorioForm } from './OrdenLaboratorioForm';
import { OrdenImagenesForm } from './OrdenImagenesForm';

const FORMS: Record<DocumentType, FC> = {
  receta: RecetaForm,
  certificado: CertificadoForm,
  referimiento: ReferimientoForm,
  orden_laboratorio: OrdenLaboratorioForm,
  orden_imagenes: OrdenImagenesForm,
};

// Crear: el tipo viene en la URL (/documentos/nuevo/:tipo)
export function DocumentoFormNuevo() {
  const { tipo } = useParams<{ tipo: string }>();
  const t = resolveDocType(tipo || '');
  if (!t) return <div className="p-6 text-slate-400">Tipo de documento no válido.</div>;
  const Form = FORMS[t];
  return <Form />;
}

// Editar: hay que cargar el doc para conocer su tipo (/documentos/:id/editar)
export function DocumentoFormEditar() {
  const { id } = useParams<{ id: string }>();
  const { clinicId } = useAuth();
  const [type, setType] = useState<DocumentType | null | 'loading'>('loading');

  useEffect(() => {
    if (!id) return;
    getClinicalDocument(clinicId!, id)
      .then((d) => setType(resolveDocType(d.type)))
      .catch(() => setType(null));
  }, [id, clinicId]);

  if (type === 'loading') return <LoadingPage />;
  if (!type) return <div className="p-6 text-slate-400">Documento no encontrado o tipo no válido.</div>;
  const Form = FORMS[type];
  return <Form />;
}
