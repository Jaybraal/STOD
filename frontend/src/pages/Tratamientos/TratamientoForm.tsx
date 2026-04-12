import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import { useTreatmentMutations } from '../../hooks/useTreatments';
import { useConfig } from '../../hooks/useConfig';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { LoadingPage } from '../../components/ui/Spinner';
import type { Treatment, TreatmentStatus, CustomField } from '../../db/schemas';
import { TEETH_FDI } from '../../utils/constants';
import { todayStr } from '../../utils/dateUtils';
import { Save, Trash2 } from 'lucide-react';

const STATUS_OPTIONS: { value: TreatmentStatus; label: string }[] = [
  { value: 'planificado', label: 'Planificado' },
  { value: 'en_proceso',  label: 'En proceso' },
  { value: 'completado',  label: 'Completado' },
];

type BaseFormData = Omit<Treatment, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'tooth' | 'customData'>;

function renderCustomField(
  field: CustomField,
  value: string,
  onChange: (val: string) => void,
  error?: string,
) {
  const base =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500';

  if (field.type === 'select') {
    const opts = (field.id === 'tooth' ? TEETH_FDI.map((t) => t.value) : field.options) || [];
    return (
      <Select
        label={field.label + (field.required ? ' *' : '')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={opts.map((o) => ({ value: o, label: o }))}
        placeholder="Seleccionar..."
        error={error}
      />
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">
          {field.label}{field.required && ' *'}
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={`${base} resize-none`}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <Input
      label={field.label + (field.required ? ' *' : '')}
      type={field.type === 'number' ? 'number' : 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      error={error}
    />
  );
}

export function TratamientoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  const { patients, loading: pLoading } = usePatients();
  const { config, loading: cLoading } = useConfig();
  const { getTreatment, createTreatment, updateTreatment, deleteTreatment } = useTreatmentMutations();

  const [form, setForm] = useState<BaseFormData>({
    patientId: searchParams.get('paciente') || '',
    procedure: '',
    status: 'planificado',
    cost: 0,
    notes: '',
    startDate: todayStr(),
    endDate: '',
  });
  const [customData, setCustomData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (!isEditing || !id) return;
    getTreatment(id).then((t) => {
      setForm({
        patientId: t.patientId,
        procedure: t.procedure,
        status: t.status,
        cost: t.cost,
        notes: t.notes,
        startDate: t.startDate,
        endDate: t.endDate,
      });
      // Migrar campo legacy 'tooth' si existe
      const legacy: Record<string, string> = {};
      if (t.tooth) legacy['tooth'] = t.tooth;
      setCustomData({ ...legacy, ...(t.customData as Record<string, string> | undefined || {}) });
      setLoading(false);
    });
  }, [id, isEditing]);

  const treatmentFields = config?.treatmentFields || [];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.patientId) e.patientId = 'Selecciona un paciente';
    if (!form.procedure.trim()) e.procedure = 'El procedimiento es requerido';
    treatmentFields.forEach((f) => {
      if (f.required && !customData[f.id]?.trim()) {
        e[f.id] = `${f.label} es requerido`;
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, customData };
      if (isEditing && id) {
        await updateTreatment(id, payload);
      } else {
        await createTreatment(payload);
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

  if (loading || pLoading || cLoading) return <LoadingPage />;

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

        <Input
          label="Procedimiento / Servicio *"
          value={form.procedure}
          onChange={(e) => setForm({ ...form, procedure: e.target.value })}
          placeholder="Describe el procedimiento o servicio..."
          error={errors.procedure}
        />

        <Select
          label="Estado"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as TreatmentStatus })}
          options={STATUS_OPTIONS}
        />

        {/* Campos personalizados según tipo de clínica */}
        {treatmentFields.map((field) =>
          renderCustomField(
            field,
            customData[field.id] || '',
            (val) => setCustomData((prev) => ({ ...prev, [field.id]: val })),
            errors[field.id],
          )
        )}

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
