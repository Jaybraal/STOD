import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import { useAppointmentMutations } from '../../hooks/useAppointments';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { LoadingPage } from '../../components/ui/Spinner';
import type { Appointment, AppointmentStatus } from '../../db/schemas';
import { APPOINTMENT_DURATIONS } from '../../utils/constants';
import { todayStr } from '../../utils/dateUtils';
import { Save, Trash2 } from 'lucide-react';

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'programada', label: 'Programada' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'no_asistio', label: 'No asistió' },
];

type FormData = Omit<Appointment, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export function CitaForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  const { patients, loading: pLoading } = usePatients();
  const { createAppointment, updateAppointment, deleteAppointment, getAppointment } = useAppointmentMutations();
  const [form, setForm] = useState<FormData>({
    patientId: searchParams.get('paciente') || '',
    date: todayStr(),
    time: '09:00',
    duration: 30,
    reason: '',
    status: 'programada',
    notes: '',
  });
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    if (!isEditing || !id) return;
    getAppointment(id).then((apt) => {
      setForm({
        patientId: apt.patientId,
        date: apt.date,
        time: apt.time,
        duration: apt.duration,
        reason: apt.reason,
        status: apt.status,
        notes: apt.notes,
      });
      setLoading(false);
    });
  }, [id, isEditing]);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.patientId) e.patientId = 'Selecciona un paciente';
    if (!form.date) e.date = 'La fecha es requerida';
    if (!form.time) e.time = 'La hora es requerida';
    if (!form.reason.trim()) e.reason = 'El motivo es requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEditing && id) {
        await updateAppointment(id, form);
      } else {
        await createAppointment(form);
      }
      navigate('/citas');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('¿Eliminar esta cita?')) return;
    await deleteAppointment(id);
    navigate('/citas');
  };

  if (loading || pLoading) return <LoadingPage />;

  const patientOptions = patients.map((p) => ({ value: p._id, label: p.name }));

  return (
    <div>
      <Header title={isEditing ? 'Editar cita' : 'Nueva cita'} />
      <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4 max-w-xl">
        <Select
          label="Paciente *"
          value={form.patientId}
          onChange={(e) => setForm({ ...form, patientId: e.target.value })}
          options={patientOptions}
          placeholder="Seleccionar paciente..."
          error={errors.patientId}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha *"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            error={errors.date}
          />
          <Input
            label="Hora *"
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            error={errors.time}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Duración"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
            options={APPOINTMENT_DURATIONS.map((d) => ({ value: d.value, label: d.label }))}
          />
          <Select
            label="Estado"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })}
            options={STATUS_OPTIONS}
          />
        </div>

        <Input
          label="Motivo / Procedimiento *"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          placeholder="Consulta de seguimiento, primera visita..."
          error={errors.reason}
        />

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
