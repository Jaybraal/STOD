import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatient, createPatient, updatePatient } from '../../hooks/usePatients';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { Patient } from '../../db/schemas';
import { LoadingPage } from '../../components/ui/Spinner';
import { Save } from 'lucide-react';

type FormData = Omit<Patient, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

const EMPTY_FORM: FormData = {
  name: '',
  dob: '',
  phone: '',
  email: '',
  address: '',
  allergies: '',
  medicalHistory: '',
  notes: '',
};

export function PacienteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { patient, loading } = usePatient(id);

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (patient) {
      setForm({
        name: patient.name,
        dob: patient.dob,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        allergies: patient.allergies,
        medicalHistory: patient.medicalHistory,
        notes: patient.notes,
      });
    }
  }, [patient]);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'El nombre es requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEditing && id) {
        await updatePatient(id, form);
        navigate(`/pacientes/${id}`);
      } else {
        const created = await createPatient(form);
        navigate(`/pacientes/${created._id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <div>
      <Header title={isEditing ? 'Editar paciente' : 'Nuevo paciente'} />

      <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-6 max-w-2xl">
        <section className="space-y-4">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Datos personales</h2>
          <Input
            label="Nombre completo *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            placeholder="Juan Pérez"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fecha de nacimiento"
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
            />
            <Input
              label="Teléfono"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 234 567 8900"
            />
          </div>
          <Input
            label="Correo electrónico"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="correo@ejemplo.com"
          />
          <Input
            label="Dirección"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Calle, Ciudad"
          />
        </section>

        <section className="space-y-4">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Historia clínica</h2>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Alergias</label>
            <textarea
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              rows={2}
              placeholder="Penicilina, látex..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Antecedentes médicos</label>
            <textarea
              value={form.medicalHistory}
              onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
              rows={3}
              placeholder="Diabetes, hipertensión, medicamentos actuales..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Notas adicionales</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>
        </section>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            <Save size={16} />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
