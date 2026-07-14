import { Link } from 'react-router-dom';
import { CLINIC_TYPE_OPTIONS } from '../../utils/constants';

interface Plan {
  name: string;
  price: string;
  audience: string;
  features: string[];
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Básico',
    price: '$25',
    audience: '1 profesional, sin personal adicional',
    features: ['Ficha de paciente', 'Documentos profesionales', 'Agenda de citas'],
  },
  {
    name: 'Clínica',
    price: '$55',
    audience: '1-3 profesionales + personal de apoyo',
    features: [
      'Todo lo del plan Básico',
      'Invitación de personal por rol',
      'Denti — asistente con IA',
    ],
    highlighted: true,
  },
  {
    name: 'Clínica+',
    price: '$95',
    audience: 'Clínicas con 4+ profesionales',
    features: ['Todo lo del plan Clínica', 'Soporte prioritario', 'Branding avanzado'],
  },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center">
              <span className="text-white font-bold text-base">S</span>
            </div>
            <span className="font-bold text-slate-900 text-xl">STOD</span>
          </div>
          <Link
            to="/login"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
          El sistema de gestión para tu clínica, sin importar la especialidad
        </h1>
        <p className="text-base sm:text-lg text-slate-600 mb-8">
          Ficha de paciente, agenda, documentos profesionales y un asistente con
          IA — pensado para cualquier tipo de consultorio: odontología,
          medicina general, psicología, fisioterapia, nutrición, veterinaria y
          más.
        </p>
        <Link
          to="/login?mode=register"
          className="inline-block py-3 px-8 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Empezar prueba gratis de 14 días
        </Link>
        <p className="text-xs text-slate-400 mt-3">Sin tarjeta de crédito</p>
      </section>

      {/* Especialidades */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="flex flex-wrap justify-center gap-2">
          {CLINIC_TYPE_OPTIONS.filter((opt) => opt.value !== 'otro').map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm text-slate-600"
            >
              <span aria-hidden="true">{opt.emoji}</span>
              {opt.label}
            </span>
          ))}
        </div>
      </section>

      {/* Planes */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-semibold text-slate-900 text-center mb-10">
          Planes simples, sin sorpresas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.highlighted
                  ? 'bg-white border-sky-500 shadow-md ring-1 ring-sky-500'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              {plan.highlighted && (
                <span className="self-start mb-3 text-xs font-semibold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-full">
                  Más popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {plan.price}
                <span className="text-base font-normal text-slate-500">/mes</span>
              </p>
              <p className="text-sm text-slate-500 mt-1">{plan.audience}</p>
              <ul className="mt-6 space-y-2.5 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-sky-600 mt-0.5" aria-hidden="true">
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to="/login?mode=register"
                className={`mt-6 text-center py-2.5 px-4 text-sm font-medium rounded-lg transition-colors ${
                  plan.highlighted
                    ? 'bg-sky-600 hover:bg-sky-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                }`}
              >
                Empezar prueba gratis
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <p className="text-center text-sm text-slate-400">
          STOD — Sistema de gestión clínica
        </p>
      </footer>
    </div>
  );
}
