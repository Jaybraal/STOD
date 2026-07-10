import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Plus, X } from 'lucide-react';

export function StudyListEditor({ studies, setStudies, label }: {
  studies: string[]; setStudies: (s: string[]) => void; label: string;
}) {
  const update = (i: number, v: string) => setStudies(studies.map((s, idx) => (idx === i ? v : s)));
  const remove = (i: number) => setStudies(studies.filter((_, idx) => idx !== i));
  const add = () => setStudies([...studies, '']);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        <Button type="button" variant="ghost" size="sm" onClick={add}><Plus size={14} /> Agregar</Button>
      </div>
      <div className="space-y-2">
        {studies.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input className="flex-1" value={s} onChange={(e) => update(i, e.target.value)} placeholder="Ej: Radiografía panorámica" />
            {studies.length > 1 && (
              <button type="button" onClick={() => remove(i)} className="text-slate-400 hover:text-red-500 p-2"><X size={16} /></button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
