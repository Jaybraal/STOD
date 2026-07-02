import { AlertCircle, Check } from 'lucide-react';

interface PaywallProps {
  title?: string;
  description?: string;
  onUpgrade: () => void;
  loading?: boolean;
}

export function Paywall({
  title = 'Upgrade Required',
  description = 'Subscribe to STOD Premium to access this feature',
  onUpgrade,
  loading = false,
}: PaywallProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4 mx-auto">
          <AlertCircle className="w-6 h-6 text-blue-600" />
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">{title}</h2>
        <p className="text-gray-600 text-center mb-6">{description}</p>

        <div className="bg-blue-50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Create & manage patients</p>
              <p className="text-sm text-gray-600">Unlimited patient records</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Schedule appointments</p>
              <p className="text-sm text-gray-600">Manage your calendar</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Full access</p>
              <p className="text-sm text-gray-600">30-day money-back guarantee</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
          <p className="text-3xl font-bold text-gray-900">$150</p>
          <p className="text-sm text-gray-600">per month, cancel anytime</p>
        </div>

        <button
          onClick={onUpgrade}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
        >
          {loading ? 'Processing...' : 'Upgrade to Premium'}
        </button>
      </div>
    </div>
  );
}
