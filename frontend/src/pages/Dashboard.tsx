import { useNavigate } from 'react-router-dom';
import { useAppointmentsForDate } from '../hooks/useAppointments';
import { usePatients } from '../hooks/usePatients';
import { useTreatments } from '../hooks/useTreatments';
import { useConfig } from '../hooks/useConfig';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import { SubscriptionGate } from '../components/SubscriptionGate';
import { todayStr, formatDate } from '../utils/dateUtils';
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
} from '../utils/constants';
import { CalendarDays, Users, Stethoscope, Plus, Clock } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const today = todayStr();
  const { config } = useConfig();
  const { appointments, loading: apptLoading } = useAppointmentsForDate(today);
  const { patients, loading: ptLoading } = usePatients();
  const { treatments, loading: txLoading } = useTreatments();

  if (apptLoading || ptLoading || txLoading) return <DashboardSkeleton />;

  const activeTreatments = treatments.filter((t) => t.status === 'en_proceso');
  const todayPending = appointments.filter((a) => a.status === 'programada');
  const todayDone = appointments.filter((a) => a.status === 'completada');

  return (
    <SubscriptionGate requiredFor="read" showTrialTimer>
      <Header
        title={config?.clinicName || 'STOD'}
        actions={
          <Button size="sm" onClick={() => navigate('/citas/nueva')}>
            <Plus size={16} />
            Nueva cita
          </Button>
        }
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Saludo */}
        <div>
          <p className="text-slate-500 text-sm">
            {new Date().toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
            {config?.doctorName ? `Dr. ${config.doctorName}` : 'Bienvenido a STOD'}
          </h2>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                <CalendarDays size={20} className="text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{appointments.length}</p>
                <p className="text-xs text-slate-500">Citas hoy</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CalendarDays size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{todayDone.length}</p>
                <p className="text-xs text-slate-500">Completadas</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Users size={20} className="text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{patients.length}</p>
                <p className="text-xs text-slate-500">Pacientes</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Stethoscope size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeTreatments.length}</p>
                <p className="text-xs text-slate-500">Tratamientos activos</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Citas de hoy */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">Citas de hoy — {formatDate(today)}</h3>
            <button
              onClick={() => navigate('/citas')}
              className="text-sm text-sky-600 hover:text-sky-700 font-medium"
            >
              Ver todas
            </button>
          </div>

          {appointments.length === 0 ? (
            <Card className="p-8 text-center">
              <CalendarDays size={40} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 text-sm">No hay citas para hoy</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => navigate('/citas/nueva')}
              >
                <Plus size={14} />
                Agendar cita
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {appointments.map((apt) => (
                <Card
                  key={apt._id}
                  className="p-3"
                  onClick={() => navigate(`/citas/${apt._id}/editar`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-slate-500 min-w-[60px]">
                      <Clock size={14} />
                      <span className="text-sm font-medium">{apt.time}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{apt.reason}</p>
                      <p className="text-xs text-slate-500">{apt.duration} min</p>
                    </div>
                    <Badge
                      label={APPOINTMENT_STATUS_LABELS[apt.status]}
                      className={APPOINTMENT_STATUS_COLORS[apt.status]}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pendientes */}
        {todayPending.length > 0 && (
          <Card className="p-4 border-sky-200 bg-sky-50">
            <p className="text-sm font-medium text-sky-800">
              {todayPending.length} cita{todayPending.length > 1 ? 's' : ''} pendiente{todayPending.length > 1 ? 's' : ''} hoy
            </p>
          </Card>
        )}
      </div>
    </SubscriptionGate>
  );
}
