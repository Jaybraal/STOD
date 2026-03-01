import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import { createTreatment, updateTreatment, deleteTreatment } from '../../hooks/useTreatments';
import { getTreatment } from '../../db/queries/treatments';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { LoadingPage } from '../../components/ui/Spinner';
import type { Treatment, TreatmentStatus } from '../../db/schemas';
import { TEETH_FDI } from '../../utils/constants';
import { todayStr } from '../../utils/dateUtils';
import { Save, Trash2 } from 'lucide-react';

const STATUS_OPTIONS: { value: TreatmentStatus; label: string }[] = [
  { value: 'planificado', label: 'Planificado' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'completado', label: 'Completado' },
];

type FormData = Omit<Treatment, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export function TratamientoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  const { patients, loading: pLoading } = usePatients();
  const [form, setForm] = useState<FormData>({
    patientId: searchParams.get('paciente') || '',
    tooth: '',
    procedure: '',
    status: 'planificado',
    cost: 0,
    notes: '',
    startDate: todayStr(),
    endDate: '',
  });
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    if (!isEditing || !id) return;
    getTreatment(id).then((t) => {
      setForm({
        patientId: t.patientId,
        tooth: t.tooth,
        procedure: t.procedure,
        status: t.status,
        cost: t.cost,
        notes: t.notes,
        startDate: t.startDate,
        endDate: t.endDate,
      });
      setLoading(false);
    });
  }, [id, isEditing]);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.patientId) e.patientId = 'Selecciona un paciente';
    if (!form.procedure.trim()) e.procedure = 'El procedimiento es requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEditing && id) {
        await updateTreatment(id, form);
      } else {
        await createTreatment(form);
      }
      navigate(-1);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('¿Eliminar este tratamiento?')) return;
    await deleteTreatment(id);
    navigate(-1);
  };

  if (loading || pLoading) return <LoadingPage />;

  return (
    <div>
      <Header title={isEditing ? 'Editar tratamiento' : 'Nuevo tratamiento'} />
      <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4 max-w-xl">
        <Select
          label="Paciente *"
          value={form.patientId}
          onChange={(e) => setForm({ ...form, patientId: e.target.value })}
          options={patients.map((p) => ({ value: p._id, label: p.name }))}
          placeholder="Seleccionar paciente..."
          error={errors.patientId}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Pieza dental (FDI)"
            value={form.tooth}
            onChange={(e) => setForm({ ...form, tooth: e.target.value })}
            options={TEETH_FDI}
            placeholder="Seleccionar..."
          />
          <Select
            label="Estado"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as TreatmentStatus })}
            options={STATUS_OPTIONS}
          />
        </div>

        <Input
          label="Procedimiento *"
          value={form.procedure}
          onChange={(e) => setForm({ ...form, procedure: e.target.value })}
          placeholder="Extracción, corona, endodoncia..."
          error={errors.procedure}
        />

        <Input
          label="Costo ($)"
          type="number"
          min="0"
          step="0.01"
          value={form.cost || ''}
          onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
          placeholder="0.00"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha inicio"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <Input
            label="Fecha fin"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Notas</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            <Save size={16} />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
          {isEditing && (
            <Button type="button" variant="danger" className="ml-auto" onClick={handleDelete}>
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
