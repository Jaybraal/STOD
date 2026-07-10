import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatient, usePatientMutations } from '../../hooks/usePatients';
import { useAppointmentsForPatient } from '../../hooks/useAppointments';
import { useTreatmentsForPatient } from '../../hooks/useTreatments';
import { useClinicalDocumentsForPatient } from '../../hooks/useClinicalDocuments';
import { DOCUMENT_TYPE_META } from '../../utils/documentTypes';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { LoadingPage } from '../../components/ui/Spinner';
import { formatDate, formatAge, formatDateFriendly } from '../../utils/dateUtils';
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
  TREATMENT_STATUS_COLORS,
  TREATMENT_STATUS_LABELS,
} from '../../utils/constants';
import { Edit, Trash2, Plus, CalendarDays, Stethoscope, FileText, Phone, Mail, MapPin, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

type Tab = 'citas' | 'tratamientos' | 'documentos';

export function PacienteDetalle() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { patient, loading } = usePatient(id);
  const { deletePatient } = usePatientMutations();
  const { appointments } = useAppointmentsForPatient(id);
  const { treatments } = useTreatmentsForPatient(id);
  const { documents } = useClinicalDocumentsForPatient(id);
  const [activeTab, setActiveTab] = useState<Tab>('citas');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (loading) return <LoadingPage />;
  if (!patient) return <div className="p-6 text-red-500">Paciente no encontrado</div>;

  const handleDelete = async () => {
    if (!id) return;
    await deletePatient(id);
    navigate('/pacientes');
  };

  const TABS: { id: Tab; label: string; icon: typeof CalendarDays; count: number }[] = [
    { id: 'citas', label: 'Citas', icon: CalendarDays, count: appointments.length },
    { id: 'tratamientos', label: 'Tratamientos', icon: Stethoscope, count: treatments.length },
    { id: 'documentos', label: 'Documentos', icon: FileText, count: documents.length },
  ];

  return (
    <div>
      <Header
        title={patient.name}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/pacientes/${id}/editar`)}>
              <Edit size={14} />
              Editar
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={14} />
            </Button>
          </div>
        }
      />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Info del paciente */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center">
              <span className="text-sky-700 font-bold text-lg">{patient.name.charAt(0)}</span>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-lg">{patient.name}</h2>
              {patient.dob && (
                <p className="text-sm text-slate-500">{formatAge(patient.dob)} — {formatDate(patient.dob)}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {patient.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={14} className="text-slate-400" />
                <a href={`tel:${patient.phone}`} className="hover:text-sky-600">{patient.phone}</a>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={14} className="text-slate-400" />
                <a href={`mailto:${patient.email}`} className="hover:text-sky-600 truncate">{patient.email}</a>
              </div>
            )}
            {patient.address && (
              <div className="flex items-center gap-2 text-slate-600 sm:col-span-2">
                <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                <span>{patient.address}</span>
              </div>
            )}
            {patient.hasInsurance && (
              <div className="flex items-center gap-2 text-slate-600 sm:col-span-2">
                <ShieldCheck size={14} className="text-emerald-500 flex-shrink-0" />
                <span>{patient.insuranceProvider || 'Con seguro médico'}</span>
              </div>
            )}
          </div>

          {patient.allergies && (
            <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
              <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-red-700">Alergias</p>
                <p className="text-xs text-red-600">{patient.allergies}</p>
              </div>
            </div>
          )}

          {patient.medicalHistory && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Antecedentes</p>
              <p className="text-sm text-slate-700">{patient.medicalHistory}</p>
            </div>
          )}
        </Card>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'citas' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => navigate(`/citas/nueva?paciente=${id}`)}>
                <Plus size={14} />
                Nueva cita
              </Button>
            </div>
            {appointments.length === 0 ? (
              <Card className="p-8 text-center text-slate-400 text-sm">Sin citas registradas</Card>
            ) : (
              appointments.map((apt) => (
                <Card key={apt._id} className="p-3" onClick={() => navigate(`/citas/${apt._id}/editar`)}>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{formatDateFriendly(apt.date)}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={11} />
                        {apt.time} — {apt.duration} min
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">{apt.reason}</p>
                    </div>
                    <Badge label={APPOINTMENT_STATUS_LABELS[apt.status]} className={APPOINTMENT_STATUS_COLORS[apt.status]} />
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'tratamientos' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => navigate(`/tratamientos/nuevo?paciente=${id}`)}>
                <Plus size={14} />
                Nuevo tratamiento
              </Button>
            </div>
            {treatments.length === 0 ? (
              <Card className="p-8 text-center text-slate-400 text-sm">Sin tratamientos registrados</Card>
            ) : (
              treatments.map((t) => (
                <Card key={t._id} className="p-3" onClick={() => navigate(`/tratamientos/${t._id}/editar`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                      {t.tooth || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{t.procedure}</p>
                      <p className="text-xs text-slate-500">
                        {t.cost ? `$${t.cost.toLocaleString('es')}` : 'Sin costo'}
                      </p>
                    </div>
                    <Badge label={TREATMENT_STATUS_LABELS[t.status]} className={TREATMENT_STATUS_COLORS[t.status]} />
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => navigate(`/documentos/nuevo?paciente=${id}`)}>
                <Plus size={14} />
                Nuevo documento
              </Button>
            </div>
            {documents.length === 0 ? (
              <Card className="p-8 text-center text-slate-400 text-sm">Sin documentos registrados</Card>
            ) : (
              documents.map((d) => (
                <Card key={d._id} className="p-3" onClick={() => navigate(`/documentos/${d._id}/editar`)}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{formatDate(d.date)}</p>
                      <p className="text-xs text-slate-500">{DOCUMENT_TYPE_META[d.type]?.label ?? 'Documento'}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/documentos/${d._id}/imprimir`); }}
                      className="text-xs text-sky-600 hover:text-sky-800 font-medium px-2 py-1 rounded-md hover:bg-sky-50"
                    >
                      Imprimir
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Confirm delete */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="p-6 max-w-sm w-full">
            <h3 className="font-semibold text-slate-900 mb-2">¿Eliminar paciente?</h3>
            <p className="text-sm text-slate-500 mb-4">
              Esta acción no se puede deshacer. El paciente y sus registros serán eliminados.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
              <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
