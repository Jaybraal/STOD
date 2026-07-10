import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import { useClinicalDocumentMutations } from '../../hooks/useClinicalDocuments';
import { LoadingPage } from '../../components/ui/Spinner';
import { todayStr } from '../../utils/dateUtils';
import { DocFormShell, LabeledTextarea } from './DocFormShell';
import { StudyListEditor } from './StudyListEditor';

export function OrdenLaboratorioForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);
  const { patients, loading: pLoading } = usePatients();
  const { getDocument, createDocument, updateDocument, deleteDocument } = useClinicalDocumentMutations();

  const [patientId, setPatientId] = useState(searchParams.get('paciente') || '');
  const [date, setDate] = useState(todayStr());
  const [studies, setStudies] = useState<string[]>(['']);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing || !id) return;
    getDocument(id).then((d) => {
      setPatientId(d.patientId); setDate(d.date);
      setStudies(d.studies?.length ? d.studies : ['']);
      setDoctorNotes(d.doctorNotes || ''); setLoading(false);
    });
  }, [id, isEditing, getDocument]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { setError('Selecciona un paciente'); return; }
    setSaving(true);
    try {
      const payload = { type: 'orden_laboratorio' as const, patientId, date, studies: studies.filter((s) => s.trim()), doctorNotes };
      if (isEditing && id) { await updateDocument(id, payload); navigate(-1); }
      else { const created = await createDocument(payload); navigate(`/documentos/${created._id}/imprimir`); }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!id || !confirm('¿Eliminar esta orden?')) return;
    await deleteDocument(id); navigate('/documentos');
  };

  if (loading || pLoading) return <LoadingPage />;

  return (
    <DocFormShell
      title={isEditing ? 'Editar orden de laboratorio' : 'Nueva orden de laboratorio'}
      patients={patients} patientId={patientId} setPatientId={setPatientId}
      date={date} setDate={setDate} error={error}
      isEditing={isEditing} saving={saving} onSubmit={handleSubmit} onDelete={handleDelete} docId={id}
    >
      <StudyListEditor studies={studies} setStudies={setStudies} label="Estudios solicitados" />
      <LabeledTextarea label="Indicaciones (opcional)" value={doctorNotes} onChange={setDoctorNotes} />
    </DocFormShell>
  );
}
