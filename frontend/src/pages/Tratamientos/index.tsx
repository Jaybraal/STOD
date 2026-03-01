import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTreatments, useTreatmentsForPatient } from '../../hooks/useTreatments';
import { usePatients } from '../../hooks/usePatients';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { LoadingPage } from '../../components/ui/Spinner';
import { TREATMENT_STATUS_COLORS, TREATMENT_STATUS_LABELS } from '../../utils/constants';
import { Plus, Stethoscope } from 'lucide-react';

export function TratamientosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('paciente') || undefined;

  const { treatments: all, loading: allLoading } = useTreatments();
  const { treatments: patientTreatments, loading: ptLoading } = useTreatmentsForPatient(patientId);
  const { patients } = usePatients();

  const loading = patientId ? ptLoading : allLoading;
  const treatments = patientId ? patientTreatments : all;

  const getPatientName = (pid: string) => patients.find((p) => p._id === pid)?.name || 'Paciente';

  return (
    <div>
      <Header
        title="Tratamientos"
        actions={
          <Button size="sm" onClick={() => navigate('/tratamientos/nuevo')}>
            <Plus size={16} />
            Nuevo
          </Button>
        }
      />

      <div className="p-4 lg:p-6 space-y-3">
        {loading ? (
          <LoadingPage />
        ) : treatments.length === 0 ? (
          <Card className="p-10 text-center">
            <Stethoscope size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm mb-3">No hay tratamientos registrados</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/tratamientos/nuevo')}>
              <Plus size={14} />
              Agregar tratamiento
            </Button>
          </Card>
        ) : (
          treatments.map((t) => (
            <Card key={t._id} className="p-4" onClick={() => navigate(`/tratamientos/${t._id}/editar`)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700 flex-shrink-0">
                  {t.tooth || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{t.procedure}</p>
                  <p className="text-xs text-slate-500">
                    {getPatientName(t.patientId)}
                    {t.cost ? ` · $${t.cost.toLocaleString('es')}` : ''}
                  </p>
                </div>
                <Badge label={TREATMENT_STATUS_LABELS[t.status]} className={TREATMENT_STATUS_COLORS[t.status]} />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
