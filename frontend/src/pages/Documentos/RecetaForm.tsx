import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import { useClinicalDocumentMutations } from '../../hooks/useClinicalDocuments';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { LoadingPage } from '../../components/ui/Spinner';
import type { Medication } from '../../db/schemas';
import { todayStr } from '../../utils/dateUtils';
import { generateId } from '../../db';
import { Save, Trash2, Plus, X, Printer } from 'lucide-react';

const EMPTY_MED = (): Medication => ({ id: generateId('med'), name: '', dosage: '', frequency: '', duration: '', instructions: '' });

export function RecetaForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);
  const { patients, loading: pLoading } = usePatients();
  const { getDocument, createDocument, updateDocument, deleteDocument } = useClinicalDocumentMutations();

  const [patientId, setPatientId] = useState(searchParams.get('paciente') || '');
  const [date, setDate] = useState(todayStr());
  const [medications, setMedications] = useState<Medication[]>([EMPTY_MED()]);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing || !id) return;
    getDocument(id).then((d) => {
      setPatientId(d.patientId);
      setDate(d.date);
      setMedications(d.medications?.length ? d.medications : [EMPTY_MED()]);
      setDoctorNotes(d.doctorNotes || '');
      setLoading(false);
    });
  }, [id, isEditing]);

  const addMed = () => setMedications((m) => [...m, EMPTY_MED()]);
  const removeMed = (mid: string) => setMedications((m) => m.filter((x) => x.id !== mid));
  const updateMed = (mid: string, field: keyof Medication, value: string) =>
    setMedications((m) => m.map((x) => (x.id === mid ? { ...x, [field]: value } : x)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { setError('Selecciona un paciente'); return; }
    setSaving(true);
    try {
      const payload = { type: 'receta' as const, patientId, date, medications, doctorNotes };
      if (isEditing && id) { await updateDocument(id, payload); navigate(-1); }
      else { const created = await createDocument(payload); navigate(`/documentos/${created._id}/imprimir`); }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!id || !confirm('¿Eliminar esta receta?')) return;
    await deleteDocument(id);
    navigate('/documentos');
  };

  if (loading || pLoading) return <LoadingPage />;

  return (
    <div>
      <Header title={isEditing ? 'Editar receta' : 'Nueva receta'} />
      <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-5 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Paciente *"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            options={patients.map((p) => ({ value: p._id, label: p.name }))}
            placeholder="Seleccionar paciente..."
            error={error}
          />
          <Input label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700">Medicamentos</label>
            <Button type="button" variant="ghost" size="sm" onClick={addMed}><Plus size={14} /> Agregar</Button>
          </div>
          <div className="space-y-4">
            {medications.map((med, idx) => (
              <div key={med.id} className="bg-slate-50 rounded-xl p-4 space-y-3 relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Medicamento {idx + 1}</span>
                  {medications.length > 1 && (
                    <button type="button" onClick={() => removeMed(med.id)} className="text-slate-400 hover:text-red-500 transition"><X size={16} /></button>
                  )}
                </div>
                <Input label="Nombre del medicamento" value={med.name} onChange={(e) => updateMed(med.id, 'name', e.target.value)} placeholder="Amoxicilina 500mg" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Dosis" value={med.dosage} onChange={(e) => updateMed(med.id, 'dosage', e.target.value)} placeholder="1 tableta" />
                  <Input label="Frecuencia" value={med.frequency} onChange={(e) => updateMed(med.id, 'frequency', e.target.value)} placeholder="Cada 8 horas" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Duración" value={med.duration} onChange={(e) => updateMed(med.id, 'duration', e.target.value)} placeholder="7 días" />
                  <Input label="Instrucciones" value={med.instructions} onChange={(e) => updateMed(med.id, 'instructions', e.target.value)} placeholder="Con alimentos" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Indicaciones del doctor</label>
          <textarea value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} rows={3} placeholder="Reposo, dieta blanda..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
        </div>
        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button type="submit" disabled={saving}><Save size={16} /> {saving ? 'Guardando...' : isEditing ? 'Guardar' : 'Guardar e imprimir'}</Button>
          {isEditing && (
            <>
              <Button type="button" variant="secondary" onClick={() => navigate(`/documentos/${id}/imprimir`)}><Printer size={16} /> Imprimir</Button>
              <Button type="button" variant="danger" className="ml-auto" onClick={handleDelete}><Trash2 size={16} /></Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
