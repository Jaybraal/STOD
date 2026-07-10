import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { DOCUMENT_TYPE_LIST, DOCUMENT_TYPE_META } from '../../utils/documentTypes';
import { FileText, ShieldCheck, ArrowRightCircle, FlaskConical, ScanLine } from 'lucide-react';
import type { DocumentType } from '../../db/schemas';

const ICONS: Record<DocumentType, typeof FileText> = {
  receta: FileText,
  certificado: ShieldCheck,
  referimiento: ArrowRightCircle,
  orden_laboratorio: FlaskConical,
  orden_imagenes: ScanLine,
};

export function SelectorTipo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paciente = searchParams.get('paciente');
  const suffix = paciente ? `?paciente=${paciente}` : '';

  return (
    <div>
      <Header title="Nuevo documento" />
      <div className="p-4 lg:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
        {DOCUMENT_TYPE_LIST.map((t) => {
          const Icon = ICONS[t];
          return (
            <Card key={t} className="p-5 cursor-pointer hover:border-sky-300 transition" onClick={() => navigate(`/documentos/nuevo/${t}${suffix}`)}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Icon size={20} className="text-sky-600" />
                </div>
                <span className="font-medium text-slate-900">{DOCUMENT_TYPE_META[t].label}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
