import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import type { Patient } from '../../db/schemas';
import { Save, Trash2, Printer } from 'lucide-react';

export function DocFormShell({
  title, patients, patientId, setPatientId, date, setDate, error,
  isEditing, saving, onSubmit, onDelete, docId, children,
}: {
  title: string;
  patients: Patient[];
  patientId: string;
  setPatientId: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  error?: string;
  isEditing: boolean;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  docId?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div>
      <Header title={title} />
      <form onSubmit={onSubmit} className="p-4 lg:p-6 space-y-5 max-w-2xl">
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
        {children}
        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button type="submit" disabled={saving}><Save size={16} /> {saving ? 'Guardando...' : isEditing ? 'Guardar' : 'Guardar e imprimir'}</Button>
          {isEditing && docId && (
            <>
              <Button type="button" variant="secondary" onClick={() => navigate(`/documentos/${docId}/imprimir`)}><Printer size={16} /> Imprimir</Button>
              <Button type="button" variant="danger" className="ml-auto" onClick={onDelete}><Trash2 size={16} /></Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export function LabeledTextarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
    </div>
  );
}
