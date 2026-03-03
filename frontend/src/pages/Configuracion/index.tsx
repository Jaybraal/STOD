import { useState, useEffect } from 'react';
import { useConfig } from '../../hooks/useConfig';
import { useAuth } from '../../context/AuthContext';
import { generateJoinCode } from '../../db/queries/config';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingPage } from '../../components/ui/Spinner';
import { Save, Check, RefreshCw, Copy, Users } from 'lucide-react';

export function ConfiguracionPage() {
  const { config, loading, updateConfig } = useConfig();
  const { clinicId, user } = useAuth();
  const isOwner = user?.uid === clinicId; // Solo el dueño puede generar códigos
  const [form, setForm] = useState({ clinicName: '', doctorName: '', phone: '', address: '' });
  const [saved, setSaved] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        clinicName: config.clinicName,
        doctorName: config.doctorName,
        phone: config.phone,
        address: config.address,
      });
    }
  }, [config]);

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGenerateCode = async () => {
    if (!clinicId) return;
    setGeneratingCode(true);
    await generateJoinCode(clinicId);
    setGeneratingCode(false);
  };

  const handleCopyCode = () => {
    if (!config?.joinCode) return;
    navigator.clipboard.writeText(config.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              placeholder="Clínica Dental Sonrisa"
            />
            <Input
              label="Nombre del doctor/a"
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

        {/* Código de conexión */}
        {isOwner && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users size={18} className="text-sky-500" />
              <h2 className="font-semibold text-slate-900">Código de conexión</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Genera un código para que otros dispositivos o empleados se conecten a los datos de esta clínica.
              Cada dispositivo usará su propia cuenta pero verá los mismos datos.
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
                <p className="text-xs text-slate-400">
                  Al generar un nuevo código, el anterior deja de funcionar.
                </p>
              </div>
            ) : (
              <Button onClick={handleGenerateCode} disabled={generatingCode} variant="secondary">
                <RefreshCw size={16} className={generatingCode ? 'animate-spin' : ''} />
                {generatingCode ? 'Generando...' : 'Generar código de conexión'}
              </Button>
            )}
          </Card>
        )}

        {/* Info versión */}
        <p className="text-xs text-slate-400 text-center">STOD v1.0 — Sistema de Odontología</p>
      </div>
    </div>
  );
}
