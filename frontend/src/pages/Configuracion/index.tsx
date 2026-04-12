import { useState, useEffect } from 'react';
import { useConfig } from '../../hooks/useConfig';
import { useAuth } from '../../context/AuthContext';
import { generateJoinCode } from '../../db/queries/config';
import { subscribeClinicUsers, approveMember, removeMember, type ClinicUser } from '../../db/queries/joinRequests';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../db/firebase';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingPage } from '../../components/ui/Spinner';
import type { CustomField, CustomFieldType, ClinicType } from '../../db/schemas';
import { CLINIC_TYPE_OPTIONS, DEFAULT_TREATMENT_FIELDS } from '../../utils/constants';
import {
  Save, Check, RefreshCw, Copy, Users, LogOut, UserCheck, UserX, UserMinus,
  Plus, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react';

const FIELD_TYPE_OPTIONS: { value: CustomFieldType; label: string }[] = [
  { value: 'text',     label: 'Texto libre' },
  { value: 'number',   label: 'Número' },
  { value: 'select',   label: 'Lista de opciones' },
  { value: 'textarea', label: 'Texto largo' },
];

function CustomFieldEditor({
  field,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  field: CustomField;
  onChange: (f: CustomField) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">
            {field.label || <span className="text-slate-400 italic">Sin nombre</span>}
          </p>
          <p className="text-xs text-slate-400">
            {FIELD_TYPE_OPTIONS.find((o) => o.value === field.type)?.label}
            {field.required && ' · Requerido'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            {expanded ? 'Ocultar' : 'Editar'}
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-3 space-y-3 bg-slate-50">
          <Input
            label="Etiqueta del campo"
            value={field.label}
            onChange={(e) => onChange({ ...field, label: e.target.value })}
            placeholder="Ej: Zona corporal"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Tipo</label>
              <select
                value={field.type}
                onChange={(e) => onChange({ ...field, type: e.target.value as CustomFieldType, options: [] })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {FIELD_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Placeholder</label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
                placeholder="Texto de ayuda..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
          {field.type === 'select' && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Opciones <span className="text-slate-400">(separadas por coma)</span>
              </label>
              <input
                type="text"
                value={(field.options || []).join(', ')}
                onChange={(e) =>
                  onChange({
                    ...field,
                    options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="Opción 1, Opción 2, Opción 3"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onChange({ ...field, required: e.target.checked })}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            Campo requerido
          </label>
        </div>
      )}
    </div>
  );
}

export function ConfiguracionPage() {
  const { config, loading, updateConfig } = useConfig();
  const { clinicId, user } = useAuth();
  const isOwner = user?.uid === clinicId;

  const [form, setForm] = useState({ clinicName: '', doctorName: '', phone: '', address: '' });
  const [saved, setSaved] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState<ClinicUser[]>([]);
  const [members, setMembers] = useState<ClinicUser[]>([]);

  const [clinicType, setClinicType] = useState<ClinicType | ''>('');
  const [treatmentFields, setTreatmentFields] = useState<CustomField[]>([]);
  const [fieldsSaved, setFieldsSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        clinicName: config.clinicName,
        doctorName: config.doctorName,
        phone: config.phone,
        address: config.address,
      });
      setClinicType(config.clinicType || '');
      setTreatmentFields(config.treatmentFields || []);
    }
  }, [config]);

  useEffect(() => {
    if (!isOwner || !clinicId) return;
    const unsub = subscribeClinicUsers(clinicId, (p, m) => {
      setPending(p);
      setMembers(m);
    });
    return unsub;
  }, [isOwner, clinicId]);

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClinicTypeChange = (newType: ClinicType) => {
    setClinicType(newType);
    if (treatmentFields.length === 0) {
      setTreatmentFields(DEFAULT_TREATMENT_FIELDS[newType] || []);
    }
  };

  const handleLoadDefaults = () => {
    if (!clinicType) return;
    if (
      treatmentFields.length > 0 &&
      !confirm('¿Reemplazar los campos actuales con los predeterminados para este tipo de consultorio?')
    ) return;
    setTreatmentFields(DEFAULT_TREATMENT_FIELDS[clinicType as ClinicType] || []);
  };

  const handleSaveFields = async () => {
    await updateConfig({ clinicType: clinicType as ClinicType, treatmentFields });
    setFieldsSaved(true);
    setTimeout(() => setFieldsSaved(false), 2000);
  };

  const handleAddField = () => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'text',
      placeholder: '',
      required: false,
    };
    setTreatmentFields((prev) => [...prev, newField]);
  };

  const handleUpdateField = (idx: number, updated: CustomField) => {
    setTreatmentFields((prev) => prev.map((f, i) => (i === idx ? updated : f)));
  };

  const handleDeleteField = (idx: number) => {
    setTreatmentFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMoveField = (idx: number, dir: 'up' | 'down') => {
    setTreatmentFields((prev) => {
      const arr = [...prev];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  const handleGenerateCode = async () => {
    if (!clinicId) return;
    setGeneratingCode(true);
    await generateJoinCode(clinicId);
    setGeneratingCode(false);
  };

  const handleLeaveClinic = async () => {
    if (!user) return;
    if (!confirm('¿Desvincularte de este consultorio? Tu cuenta quedará independiente.')) return;
    await deleteDoc(doc(db, 'users', user.uid));
    window.location.reload();
  };

  const handleCopyCode = () => {
    if (!config?.joinCode) return;
    navigator.clipboard.writeText(config.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async (uid: string) => { await approveMember(uid); };
  const handleReject  = async (uid: string) => {
    if (!confirm('¿Rechazar esta solicitud?')) return;
    await removeMember(uid);
  };
  const handleRemove  = async (uid: string, email: string) => {
    if (!confirm(`¿Eliminar acceso de ${email}?`)) return;
    await removeMember(uid);
  };

  if (loading) return <LoadingPage />;

  return (
    <div>
      <Header title="Configuración" />

      <div className="p-4 lg:p-6 space-y-6 max-w-2xl">
        {/* Datos del consultorio */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Datos del consultorio</h2>
          <form onSubmit={handleSaveClinic} className="space-y-4">
            <Input
              label="Nombre del consultorio"
              value={form.clinicName}
              onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
              placeholder="Consultorio Médico Ejemplo"
            />
            <Input
              label="Nombre del doctor/a o responsable"
              value={form.doctorName}
              onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
              placeholder="Juan Pérez"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Teléfono"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
              <Input
                label="Dirección"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Calle, Ciudad"
              />
            </div>
            <Button type="submit">
              {saved ? <><Check size={16} /> Guardado</> : <><Save size={16} /> Guardar</>}
            </Button>
          </form>
        </Card>

        {/* Tipo de consultorio + campos personalizados (solo owner) */}
        {isOwner && (
          <Card className="p-5">
            <h2 className="font-semibold text-slate-900 mb-1">Tipo de consultorio</h2>
            <p className="text-sm text-slate-500 mb-4">
              Selecciona tu especialidad para cargar campos de tratamiento predeterminados,
              o defínelos completamente a tu gusto.
            </p>

            {/* Selector visual de tipo */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
              {CLINIC_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleClinicTypeChange(opt.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm font-medium transition-colors ${
                    clinicType === opt.value
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="text-center leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Editor de campos del formulario de tratamiento */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Campos extra en tratamientos</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Aparecen al crear o editar un tratamiento, además de los campos básicos.
                  </p>
                </div>
                {clinicType && (
                  <button
                    type="button"
                    onClick={handleLoadDefaults}
                    className="text-xs text-sky-600 hover:text-sky-700 underline whitespace-nowrap ml-3"
                  >
                    Cargar predeterminados
                  </button>
                )}
              </div>

              {treatmentFields.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                  Sin campos extra — los tratamientos solo tendrán los campos básicos
                  (procedimiento, costo, fechas, notas).
                </div>
              ) : (
                <div className="space-y-2">
                  {treatmentFields.map((field, idx) => (
                    <CustomFieldEditor
                      key={field.id}
                      field={field}
                      onChange={(updated) => handleUpdateField(idx, updated)}
                      onDelete={() => handleDeleteField(idx)}
                      onMoveUp={() => handleMoveField(idx, 'up')}
                      onMoveDown={() => handleMoveField(idx, 'down')}
                      isFirst={idx === 0}
                      isLast={idx === treatmentFields.length - 1}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <Button type="button" variant="secondary" size="sm" onClick={handleAddField}>
                  <Plus size={14} />
                  Agregar campo
                </Button>
                <Button type="button" size="sm" onClick={handleSaveFields}>
                  {fieldsSaved
                    ? <><Check size={14} /> Guardado</>
                    : <><Save size={14} /> Guardar cambios</>}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Código de conexión */}
        {isOwner && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users size={18} className="text-sky-500" />
              <h2 className="font-semibold text-slate-900">Código de conexión</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Genera un código para que otros dispositivos o empleados soliciten acceso a este consultorio.
              Deberás aprobar cada solicitud manualmente.
            </p>

            {config?.joinCode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <span className="font-mono text-2xl font-bold tracking-widest text-sky-700 flex-1 text-center">
                    {config.joinCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="text-slate-400 hover:text-sky-600 transition-colors"
                    title="Copiar código"
                  >
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleGenerateCode} disabled={generatingCode}>
                    <RefreshCw size={14} className={generatingCode ? 'animate-spin' : ''} />
                    {generatingCode ? 'Generando...' : 'Nuevo código'}
                  </Button>
                </div>
                <p className="text-xs text-slate-400">Al generar un nuevo código, el anterior deja de funcionar.</p>
              </div>
            ) : (
              <Button onClick={handleGenerateCode} disabled={generatingCode} variant="secondary">
                <RefreshCw size={16} className={generatingCode ? 'animate-spin' : ''} />
                {generatingCode ? 'Generando...' : 'Generar código de conexión'}
              </Button>
            )}
          </Card>
        )}

        {/* Solicitudes pendientes */}
        {isOwner && pending.length > 0 && (
          <Card className="p-5 border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck size={18} className="text-amber-500" />
              <h2 className="font-semibold text-slate-900">Solicitudes pendientes</h2>
              <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Estos dispositivos quieren conectarse a tu consultorio.
            </p>
            <div className="space-y-2">
              {pending.map((u) => (
                <div key={u.uid} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{u.email}</p>
                    {u.joinedAt && (
                      <p className="text-xs text-slate-400">
                        {new Date(u.joinedAt).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    )}
                  </div>
                  <button onClick={() => handleApprove(u.uid)} className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors">
                    <UserCheck size={14} /> Aprobar
                  </button>
                  <button onClick={() => handleReject(u.uid)} className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                    <UserX size={14} /> Rechazar
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Miembros conectados */}
        {isOwner && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users size={18} className="text-sky-500" />
              <h2 className="font-semibold text-slate-900">Miembros conectados</h2>
              {members.length > 0 && (
                <span className="ml-auto bg-sky-100 text-sky-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {members.length}
                </span>
              )}
            </div>
            {members.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">Ningún dispositivo aprobado todavía.</p>
            ) : (
              <div className="space-y-2">
                {members.map((u) => (
                  <div key={u.uid} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{u.email}</p>
                      {u.joinedAt && (
                        <p className="text-xs text-slate-400">
                          Conectado el {new Date(u.joinedAt).toLocaleString('es', { dateStyle: 'medium' })}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(u.uid, u.email)}
                      className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <UserMinus size={14} /> Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Desvincular (solo miembros) */}
        {!isOwner && (
          <Card className="p-5 border-red-100">
            <div className="flex items-center gap-2 mb-3">
              <LogOut size={18} className="text-red-400" />
              <h2 className="font-semibold text-slate-900">Desvincular dispositivo</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Este dispositivo está conectado a un consultorio. Al desvincularte, tu cuenta quedará
              independiente y ya no verás los datos de ese consultorio.
            </p>
            <Button variant="danger" onClick={handleLeaveClinic}>
              Desvincularse de este consultorio
            </Button>
          </Card>
        )}

        <p className="text-xs text-slate-400 text-center">MediSys v1.0 — Sistema de Gestión de Consultorio</p>
      </div>
    </div>
  );
}
