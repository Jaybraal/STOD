import { useState, useEffect } from 'react';
import { useConfig, updateConfig, saveSyncCredentials } from '../../hooks/useConfig';
import { startSync, stopSync } from '../../db/sync';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SyncStatusBar } from '../../components/SyncStatusBar';
import { LoadingPage } from '../../components/ui/Spinner';
import { API_URL } from '../../utils/constants';
import { Save, RefreshCw, Link2, Copy, Check, WifiOff } from 'lucide-react';

export function ConfiguracionPage() {
  const { config, loading } = useConfig();
  const [form, setForm] = useState({ clinicName: '', doctorName: '', phone: '', address: '' });
  const [saved, setSaved] = useState(false);

  // Sync state
  const [generating, setGenerating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [syncError, setSyncError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        clinicName: config.clinicName,
        doctorName: config.doctorName,
        phone: config.phone,
        address: config.address,
      });
      // Si hay credenciales guardadas, iniciar sync
      if (config.syncUrl && config.syncUsername && config.syncPassword) {
        startSync(config.syncUrl, config.syncUsername, config.syncPassword);
      }
    }
  }, [config]);

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    setSyncError('');
    try {
      const res = await fetch(`${API_URL}/api/sync/generate`, { method: 'POST' });
      if (!res.ok) throw new Error('Error generando código');
      const data = await res.json();
      await saveSyncCredentials(data.code, data.syncUrl, data.username, data.password);
      startSync(data.syncUrl, data.username, data.password);
    } catch (err) {
      setSyncError('No se pudo generar el código. Verifica tu conexión.');
    } finally {
      setGenerating(false);
    }
  };

  const handleConnect = async () => {
    if (!syncCodeInput.trim()) return;
    setConnecting(true);
    setSyncError('');
    try {
      const res = await fetch(`${API_URL}/api/sync/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: syncCodeInput.trim().toUpperCase() }),
      });
      if (!res.ok) throw new Error('Código no encontrado');
      const data = await res.json();
      await saveSyncCredentials(data.code, data.syncUrl, data.username, data.password);
      startSync(data.syncUrl, data.username, data.password);
      setSyncCodeInput('');
    } catch (err) {
      setSyncError('Código inválido o expirado. Verifica e intenta de nuevo.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Desconectar la sincronización? Los datos no se eliminarán.')) return;
    stopSync();
    await updateConfig({ syncCode: null, syncUrl: null, syncUsername: null, syncPassword: null });
  };

  const handleCopy = () => {
    if (config?.syncCode) {
      navigator.clipboard.writeText(config.syncCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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

        {/* Sincronización */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-slate-900">Sincronización entre dispositivos</h2>
            <SyncStatusBar />
          </div>
          <p className="text-sm text-slate-500 mb-5">
            Conecta dos dispositivos para compartir todos los datos en tiempo real.
            Funciona con internet; sin conexión los datos se guardan localmente.
          </p>

          {syncError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">
              <WifiOff size={16} />
              {syncError}
            </div>
          )}

          {config?.syncCode ? (
            /* Ya tiene código */
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Tu código de conexión</p>
                <div className="flex items-center gap-3 p-4 bg-sky-50 rounded-xl border-2 border-sky-200">
                  <span className="font-mono text-2xl font-bold text-sky-700 tracking-widest flex-1">
                    {config.syncCode}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-sky-300 text-sky-700 hover:bg-sky-50 transition"
                  >
                    {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Ingresa este código en el otro dispositivo para sincronizar.
                </p>
              </div>

              <Button variant="secondary" size="sm" onClick={handleDisconnect}>
                Desconectar sincronización
              </Button>
            </div>
          ) : (
            /* Sin código */
            <div className="space-y-5">
              {/* Generar código */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Este es el dispositivo principal
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Genera un código en este dispositivo y luego ingrésalo en el otro.
                </p>
                <Button onClick={handleGenerateCode} disabled={generating}>
                  <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
                  {generating ? 'Generando...' : 'Generar código de conexión'}
                </Button>
              </div>

              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-slate-200" />
                <span className="text-xs text-slate-400 font-medium">O</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              {/* Ingresar código */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Este es el segundo dispositivo
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Ingresa el código generado en el dispositivo principal.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={syncCodeInput}
                    onChange={(e) => setSyncCodeInput(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX"
                    maxLength={9}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <Button
                    onClick={handleConnect}
                    disabled={connecting || syncCodeInput.length < 4}
                  >
                    <Link2 size={16} />
                    {connecting ? 'Conectando...' : 'Conectar'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Info versión */}
        <p className="text-xs text-slate-400 text-center">STOD v1.0 — Sistema de Odontología</p>
      </div>
    </div>
  );
}
