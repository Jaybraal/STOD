import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import { usePrescriptionMutations } from '../../hooks/usePrescriptions';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { LoadingPage } from '../../components/ui/Spinner';
import type { Prescription, Medication } from '../../db/schemas';
import { todayStr } from '../../utils/dateUtils';
import { generateId } from '../../db';
import { Save, Trash2, Plus, X, Printer } from 'lucide-react';

const EMPTY_MED = (): Medication => ({
  id: generateId('med'),
  name: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
});

type FormData = Omit<Prescription, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export function RecetaForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  const { patients, loading: pLoading } = usePatients();
  const { getPrescription, createPrescription, updatePrescription, deletePrescription } = usePrescriptionMutations();
  const [form, setForm] = useState<FormData>({
    patientId: searchParams.get('paciente') || '',
    appointmentId: '',
    date: todayStr(),
    medications: [EMPTY_MED()],
    doctorNotes: '',
  });
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    if (!isEditing || !id) return;
    getPrescription(id).then((rx) => {
      setForm({
        patientId: rx.patientId,
        appointmentId: rx.appointmentId,
        date: rx.date,
        medications: rx.medications,
        doctorNotes: rx.doctorNotes,
      });
      setLoading(false);
    });
  }, [id, isEditing]);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.patientId) e.patientId = 'Selecciona un paciente';
    if (form.medications.length === 0) e.medications = 'Agrega al menos un medicamento';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEditing && id) {
        await updatePrescription(id, form);
      } else {
        const created = await createPrescription(form);
        navigate(`/recetas/${created._id}/imprimir`);
        return;
      }
      navigate(-1);
    } finally {
      setSaving(false);
    }
  };

  const addMed = () => setForm({ ...form, medications: [...form.medications, EMPTY_MED()] });

  const removeMed = (medId: string) =>
    setForm({ ...form, medications: form.medications.filter((m) => m.id !== medId) });

  const updateMed = (medId: string, field: keyof Medication, value: string) =>
    setForm({
      ...form,
      medications: form.medications.map((m) => m.id === medId ? { ...m, [field]: value } : m),
    });

  const handleDelete = async () => {
    if (!id || !confirm('¿Eliminar esta receta?')) return;
    await deletePrescription(id);
    navigate('/recetas');
  };

  if (loading || pLoading) return <LoadingPage />;

  return (
    <div>
      <Header title={isEditing ? 'Editar receta' : 'Nueva receta'} />
      <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-5 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Paciente *"
            value={form.patientId}
            onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            options={patients.map((p) => ({ value: p._id, label: p.name }))}
            placeholder="Seleccionar paciente..."
            error={errors.patientId}
          />
          <Input
            label="Fecha"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>

        {/* Medicamentos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700">Medicamentos</label>
            <Button type="button" variant="ghost" size="sm" onClick={addMed}>
              <Plus size={14} />
              Agregar
            </Button>
          </div>

          {errors.medications && <p className="text-xs text-red-500 mb-2">{errors.medications}</p>}

          <div className="space-y-4">
            {form.medications.map((med, idx) => (
              <div key={med.id} className="bg-slate-50 rounded-xl p-4 space-y-3 relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    Medicamento {idx + 1}
                  </span>
                  {form.medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMed(med.id)}
                      className="text-slate-400 hover:text-red-500 transition"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <Input
                  label="Nombre del medicamento"
                  value={med.name}
                  onChange={(e) => updateMed(med.id, 'name', e.target.value)}
                  placeholder="Amoxicilina 500mg"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Dosis"
                    value={med.dosage}
                    onChange={(e) => updateMed(med.id, 'dosage', e.target.value)}
                    placeholder="1 tableta"
                  />
                  <Input
                    label="Frecuencia"
                    value={med.frequency}
                    onChange={(e) => updateMed(med.id, 'frequency', e.target.value)}
                    placeholder="Cada 8 horas"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Duración"
                    value={med.duration}
                    onChange={(e) => updateMed(med.id, 'duration', e.target.value)}
                    placeholder="7 días"
                  />
                  <Input
                    label="Instrucciones"
                    value={med.instructions}
                    onChange={(e) => updateMed(med.id, 'instructions', e.target.value)}
                    placeholder="Con alimentos"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Indicaciones del doctor</label>
          <textarea
            value={form.doctorNotes}
            onChange={(e) => setForm({ ...form, doctorNotes: e.target.value })}
            rows={3}
            placeholder="Reposo, dieta blanda..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            <Save size={16} />
            {saving ? 'Guardando...' : isEditing ? 'Guardar' : 'Guardar e imprimir'}
          </Button>
          {isEditing && (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/recetas/${id}/imprimir`)}
              >
                <Printer size={16} />
                Imprimir
              </Button>
              <Button type="button" variant="danger" className="ml-auto" onClick={handleDelete}>
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
