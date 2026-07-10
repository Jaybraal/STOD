import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import { useClinicalDocumentMutations } from '../../hooks/useClinicalDocuments';
import { Input } from '../../components/ui/Input';
import { LoadingPage } from '../../components/ui/Spinner';
import { todayStr } from '../../utils/dateUtils';
import { DocFormShell, LabeledTextarea } from './DocFormShell';

export function CertificadoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);
  const { patients, loading: pLoading } = usePatients();
  const { getDocument, createDocument, updateDocument, deleteDocument } = useClinicalDocumentMutations();

  const [patientId, setPatientId] = useState(searchParams.get('paciente') || '');
  const [date, setDate] = useState(todayStr());
  const [reason, setReason] = useState('');
  const [restDays, setRestDays] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing || !id) return;
    getDocument(id).then((d) => {
      setPatientId(d.patientId); setDate(d.date);
      setReason(d.reason || ''); setRestDays(d.restDays != null ? String(d.restDays) : '');
      setDoctorNotes(d.doctorNotes || ''); setLoading(false);
    });
  }, [id, isEditing, getDocument]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { setError('Selecciona un paciente'); return; }
    setSaving(true);
    try {
      const payload = { type: 'certificado' as const, patientId, date, reason, restDays: restDays ? Number(restDays) : undefined, doctorNotes };
      if (isEditing && id) { await updateDocument(id, payload); navigate(-1); }
      else { const created = await createDocument(payload); navigate(`/documentos/${created._id}/imprimir`); }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!id || !confirm('¿Eliminar este certificado?')) return;
    await deleteDocument(id); navigate('/documentos');
  };

  if (loading || pLoading) return <LoadingPage />;

  return (
    <DocFormShell
      title={isEditing ? 'Editar certificado' : 'Nuevo certificado'}
      patients={patients} patientId={patientId} setPatientId={setPatientId}
      date={date} setDate={setDate} error={error}
      isEditing={isEditing} saving={saving} onSubmit={handleSubmit} onDelete={handleDelete} docId={id}
    >
      <LabeledTextarea label="Motivo / evaluación" value={reason} onChange={setReason} placeholder="Evaluado por cuadro gripal..." />
      <Input label="Días de reposo (opcional)" type="number" min={0} value={restDays} onChange={(e) => setRestDays(e.target.value)} placeholder="1" />
      <LabeledTextarea label="Observaciones (opcional)" value={doctorNotes} onChange={setDoctorNotes} />
    </DocFormShell>
  );
}
