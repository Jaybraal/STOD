import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PatientListSkeleton } from '../../components/LoadingSkeleton';
import type { Patient } from '../../db/schemas';
import { formatAge, calcAge } from '../../utils/dateUtils';
import { Plus, Search, User, Phone } from 'lucide-react';

type SortOption = 'az' | 'za' | 'recientes' | 'antiguos';
type AgeFilter = 'todos' | 'menor' | 'adulto' | 'mayor';

const AGE_LABELS: Record<AgeFilter, string> = {
  todos: 'Todos',
  menor: 'Menor (0-17)',
  adulto: 'Adulto (18-59)',
  mayor: 'Mayor (60+)',
};

const SORT_LABELS: Record<SortOption, string> = {
  az: 'A → Z',
  za: 'Z → A',
  recientes: 'Más recientes',
  antiguos: 'Más antiguos',
};

export function PacientesList() {
  const navigate = useNavigate();
  const { patients, loading } = usePatients();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('az');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('todos');

  const displayed = useMemo(() => {
    let list: Patient[] = [...patients];

    // Filtro texto
    if (query.trim().length >= 1) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.phone?.includes(q) ||
          p.email?.toLowerCase().includes(q)
      );
    }

    // Filtro edad
    if (ageFilter !== 'todos') {
      list = list.filter((p) => {
        if (!p.dob) return false;
        const age = calcAge(p.dob);
        if (ageFilter === 'menor') return age < 18;
        if (ageFilter === 'adulto') return age >= 18 && age < 60;
        if (ageFilter === 'mayor') return age >= 60;
        return true;
      });
    }

    // Ordenar
    list.sort((a, b) => {
      if (sort === 'az') return a.name.localeCompare(b.name, 'es');
      if (sort === 'za') return b.name.localeCompare(a.name, 'es');
      if (sort === 'recientes') return b.createdAt.localeCompare(a.createdAt);
      if (sort === 'antiguos') return a.createdAt.localeCompare(b.createdAt);
      return 0;
    });

    return list;
  }, [patients, query, sort, ageFilter]);

  return (
    <div>
      <Header
        title={`Pacientes (${patients.length})`}
        actions={
          <Button size="sm" onClick={() => navigate('/pacientes/nuevo')}>
            <Plus size={16} />
            Nuevo
          </Button>
        }
      />

      <div className="p-4 lg:p-6 space-y-3">
        {/* Buscador */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Buscar por nombre, teléfono o email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Ordenar */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
              <option key={s} value={s}>{SORT_LABELS[s]}</option>
            ))}
          </select>

          {/* Edad chips */}
          <div className="flex gap-1.5 flex-wrap">
            {(Object.keys(AGE_LABELS) as AgeFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setAgeFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  ageFilter === f
                    ? 'bg-sky-500 border-sky-500 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-sky-300'
                }`}
              >
                {AGE_LABELS[f]}
              </button>
            ))}
          </div>

          {/* Resultado count */}
          {(query || ageFilter !== 'todos') && (
            <span className="text-xs text-slate-400 ml-auto">
              {displayed.length} resultado{displayed.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Lista */}
        {loading ? (
          <PatientListSkeleton />
        ) : displayed.length === 0 ? (
          <Card className="p-10 text-center">
            <User size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm mb-3">
              {query || ageFilter !== 'todos'
                ? 'No se encontraron pacientes con esos filtros'
                : 'No hay pacientes registrados'}
            </p>
            {!query && ageFilter === 'todos' && (
              <Button variant="secondary" size="sm" onClick={() => navigate('/pacientes/nuevo')}>
                <Plus size={14} />
                Agregar paciente
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-2">
            {displayed.map((p) => (
              <Card
                key={p._id}
                className="p-4"
                onClick={() => navigate(`/pacientes/${p._id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sky-700 font-semibold text-sm">
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{p.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {p.dob && (
                        <span className="text-xs text-slate-500">{formatAge(p.dob)}</span>
                      )}
                      {p.phone && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone size={11} />
                          {p.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-slate-300 text-lg">›</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
