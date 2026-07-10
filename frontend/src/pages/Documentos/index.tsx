import { useNavigate } from 'react-router-dom';
import { useClinicalDocuments } from '../../hooks/useClinicalDocuments';
import { usePatients } from '../../hooks/usePatients';
import { Header } from '../../components/layout/Header';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingPage } from '../../components/ui/Spinner';
import { formatDate } from '../../utils/dateUtils';
import { DOCUMENT_TYPE_META } from '../../utils/documentTypes';
import { Plus, FileText, Printer } from 'lucide-react';

export function DocumentosPage() {
  const navigate = useNavigate();
  const { documents, loading } = useClinicalDocuments();
  const { patients } = usePatients();
  const patientName = (pid: string) => patients.find((p) => p._id === pid)?.name || 'Paciente';

  return (
    <div>
      <Header title="Documentos" actions={
        <Button size="sm" onClick={() => navigate('/documentos/nuevo')}><Plus size={16} /> Nuevo</Button>
      } />
      <div className="p-4 lg:p-6 space-y-3">
        {loading ? <LoadingPage /> : documents.length === 0 ? (
          <Card className="p-10 text-center">
            <FileText size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm mb-3">No hay documentos registrados</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/documentos/nuevo')}><Plus size={14} /> Crear documento</Button>
          </Card>
        ) : (
          documents.map((d) => (
            <Card key={d._id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/documentos/${d._id}/editar`)}>
                  <p className="font-medium text-slate-900">{patientName(d.patientId)}</p>
                  <p className="text-xs text-slate-500">{DOCUMENT_TYPE_META[d.type]?.short ?? 'Documento'} · {formatDate(d.date)}</p>
                </div>
                <button onClick={() => navigate(`/documentos/${d._id}/imprimir`)} className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition" title="Imprimir">
                  <Printer size={18} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
