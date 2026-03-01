import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAppointments, updateAppointmentStatus } from '../../hooks/useAppointments';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { LoadingPage } from '../../components/ui/Spinner';
import type { Appointment, AppointmentStatus } from '../../db/schemas';
import { formatDateFriendly } from '../../utils/dateUtils';
import {
  APPOINTMENT_STATUS_CALENDAR,
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
} from '../../utils/constants';
import { Plus, CalendarDays, List } from 'lucide-react';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales: { es },
});

const MESSAGES = {
  allDay: 'Todo el día',
  previous: '‹',
  next: '›',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Cita',
  noEventsInRange: 'Sin citas en este período',
};

export function CitasPage() {
  const navigate = useNavigate();
  const { appointments, loading } = useAppointments();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [calView, setCalView] = useState<View>('month');
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  const events = appointments.map((apt) => ({
    id: apt._id,
    title: apt.reason,
    start: new Date(`${apt.date}T${apt.time}`),
    end: new Date(`${apt.date}T${apt.time}`),
    resource: apt,
  }));

  const handleSelectEvent = useCallback((event: (typeof events)[0]) => {
    setSelectedApt(event.resource as Appointment);
  }, []);

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    await updateAppointmentStatus(id, status);
    setSelectedApt(null);
  };

  const eventStyleGetter = (event: (typeof events)[0]) => {
    const apt = event.resource as Appointment;
    return {
      style: {
        backgroundColor: APPOINTMENT_STATUS_CALENDAR[apt.status],
        borderRadius: '6px',
        border: 'none',
        fontSize: '12px',
        padding: '2px 6px',
      },
    };
  };

  if (loading) return <LoadingPage />;

  return (
    <div>
      <Header
        title="Citas"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 ${viewMode === 'calendar' ? 'bg-sky-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
              >
                <CalendarDays size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-sky-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
              >
                <List size={16} />
              </button>
            </div>
            <Button size="sm" onClick={() => navigate('/citas/nueva')}>
              <Plus size={16} />
              Nueva
            </Button>
          </div>
        }
      />

      <div className="p-4 lg:p-6">
        {viewMode === 'calendar' ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden" style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              view={calView}
              onView={setCalView}
              messages={MESSAGES}
              culture="es"
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              formats={{
                monthHeaderFormat: (date: Date) => format(date, 'MMMM yyyy', { locale: es }),
                dayHeaderFormat: (date: Date) => format(date, 'EEEE d MMMM', { locale: es }),
              }}
              style={{ height: '100%', padding: '12px' }}
            />
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.length === 0 ? (
              <Card className="p-10 text-center text-slate-400 text-sm">
                <CalendarDays size={36} className="mx-auto mb-2 text-slate-300" />
                <p>No hay citas registradas</p>
                <Button className="mt-3" size="sm" onClick={() => navigate('/citas/nueva')}>
                  <Plus size={14} />
                  Agendar cita
                </Button>
              </Card>
            ) : (
              [...appointments]
                .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
                .map((apt) => (
                  <Card key={apt._id} className="p-3" onClick={() => navigate(`/citas/${apt._id}/editar`)}>
                    <div className="flex items-center gap-3">
                      <div className="min-w-[80px]">
                        <p className="text-sm font-medium text-slate-900">{apt.time}</p>
                        <p className="text-xs text-slate-500">{formatDateFriendly(apt.date)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 font-medium truncate">{apt.reason}</p>
                        <p className="text-xs text-slate-500">{apt.duration} min</p>
                      </div>
                      <Badge label={APPOINTMENT_STATUS_LABELS[apt.status]} className={APPOINTMENT_STATUS_COLORS[apt.status]} />
                    </div>
                  </Card>
                ))
            )}
          </div>
        )}
      </div>

      {/* Modal de cita seleccionada */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={() => setSelectedApt(null)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-900 mb-1">{selectedApt.reason}</h3>
            <p className="text-sm text-slate-500 mb-4">
              {formatDateFriendly(selectedApt.date)} a las {selectedApt.time} — {selectedApt.duration} min
            </p>

            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Cambiar estado</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(Object.keys(APPOINTMENT_STATUS_LABELS) as AppointmentStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(selectedApt._id, status)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium text-left border-2 transition-all ${
                    selectedApt.status === status ? 'border-sky-500' : 'border-transparent'
                  } ${APPOINTMENT_STATUS_COLORS[status]}`}
                >
                  {APPOINTMENT_STATUS_LABELS[status]}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedApt(null)}>
                Cerrar
              </Button>
              <Button
                className="flex-1"
                onClick={() => navigate(`/citas/${selectedApt._id}/editar`)}
              >
                Editar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
