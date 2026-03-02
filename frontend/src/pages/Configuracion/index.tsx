import { useState, useEffect } from 'react';
import { useConfig, updateConfig } from '../../hooks/useConfig';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingPage } from '../../components/ui/Spinner';
import { Save, Check, Wifi } from 'lucide-react';

export function ConfiguracionPage() {
  const { config, loading } = useConfig();
  const [form, setForm] = useState({ clinicName: '', doctorName: '', phone: '', address: '' });
  const [saved, setSaved] = useState(false);

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
          <div className="flex items-center gap-2 mb-2">
            <Wifi size={18} className="text-sky-500" />
            <h2 className="font-semibold text-slate-900">Sincronización automática</h2>
          </div>
          <p className="text-sm text-slate-500">
            Los datos se sincronizan automáticamente entre todos los dispositivos
            en tiempo real gracias a Firebase. No se requiere ninguna configuración adicional.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Mientras haya internet, los cambios en cualquier dispositivo se reflejan
            en todos los demás al instante. Sin conexión, los datos se guardan localmente
            y se sincronizan al recuperar la conexión.
          </p>
        </Card>

        {/* Info versión */}
        <p className="text-xs text-slate-400 text-center">STOD v1.0 — Sistema de Odontología</p>
      </div>
    </div>
  );
}
