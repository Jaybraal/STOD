import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import { useClinicalDocumentMutations } from '../../hooks/useClinicalDocuments';
import { Input } from '../../components/ui/Input';
import { LoadingPage } from '../../components/ui/Spinner';
import { todayStr } from '../../utils/dateUtils';
import { DocFormShell, LabeledTextarea } from './DocFormShell';

export function ReferimientoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);
  const { patients, loading: pLoading } = usePatients();
  const { getDocument, createDocument, updateDocument, deleteDocument } = useClinicalDocumentMutations();

  const [patientId, setPatientId] = useState(searchParams.get('paciente') || '');
  const [date, setDate] = useState(todayStr());
  const [toName, setToName] = useState('');
  const [toSpecialty, setToSpecialty] = useState('');
  const [reason, setReason] = useState('');
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing || !id) return;
    getDocument(id).then((d) => {
      setPatientId(d.patientId); setDate(d.date);
      setToName(d.referredTo?.name || ''); setToSpecialty(d.referredTo?.specialty || '');
      setReason(d.reason || ''); setClinicalSummary(d.clinicalSummary || '');
      setDoctorNotes(d.doctorNotes || ''); setLoading(false);
    });
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { setError('Selecciona un paciente'); return; }
    setSaving(true);
    try {
      const payload = {
        type: 'referimiento' as const, patientId, date,
        referredTo: { name: toName, specialty: toSpecialty || undefined },
        reason, clinicalSummary, doctorNotes,
      };
      if (isEditing && id) { await updateDocument(id, payload); navigate(-1); }
      else { const created = await createDocument(payload); navigate(`/documentos/${created._id}/imprimir`); }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!id || !confirm('¿Eliminar este referimiento?')) return;
    await deleteDocument(id); navigate('/documentos');
  };

  if (loading || pLoading) return <LoadingPage />;

  return (
    <DocFormShell
      title={isEditing ? 'Editar referimiento' : 'Nuevo referimiento'}
      patients={patients} patientId={patientId} setPatientId={setPatientId}
      date={date} setDate={setDate} error={error}
      isEditing={isEditing} saving={saving} onSubmit={handleSubmit} onDelete={handleDelete} docId={id}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Referir a (nombre)" value={toName} onChange={(e) => setToName(e.target.value)} placeholder="Dr. Carlos Ramírez" />
        <Input label="Especialidad (opcional)" value={toSpecialty} onChange={(e) => setToSpecialty(e.target.value)} placeholder="Cardiología" />
      </div>
      <LabeledTextarea label="Motivo" value={reason} onChange={setReason} placeholder="Evaluación por..." />
      <LabeledTextarea label="Resumen clínico" value={clinicalSummary} onChange={setClinicalSummary} />
      <LabeledTextarea label="Observaciones (opcional)" value={doctorNotes} onChange={setDoctorNotes} />
    </DocFormShell>
  );
}
