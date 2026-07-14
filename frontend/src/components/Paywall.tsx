import { AlertCircle, Check } from 'lucide-react';
import { PLANS, type PlanId } from '../constants/plans';

interface PaywallProps {
  title?: string;
  description?: string;
  onUpgrade: (planId: PlanId) => void;
  loading?: boolean;
}

export function Paywall({
  title = 'Elige tu plan',
  description = 'Suscríbete a STOD para desbloquear esta función',
  onUpgrade,
  loading = false,
}: PaywallProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-8">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4 mx-auto">
          <AlertCircle className="w-6 h-6 text-blue-600" />
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">{title}</h2>
        <p className="text-gray-600 text-center mb-6">{description}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="border border-gray-200 rounded-lg p-5 flex flex-col"
            >
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{plan.priceLabel}</p>
              <p className="text-sm text-gray-500 mb-4">{plan.audience}</p>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onUpgrade(plan.id)}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2.5 rounded-lg transition"
              >
                {loading ? 'Procesando...' : 'Elegir'}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Prueba gratis de 14 días, cancela cuando quieras.
        </p>
      </div>
    </div>
  );
}
