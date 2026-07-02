import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';

export function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'success' | 'cancel' | 'loading'>('loading');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const cancel = searchParams.get('cancel');

    if (cancel) {
      setStatus('cancel');
    } else if (sessionId) {
      // Session was created successfully
      setStatus('success');
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-600">Processing your payment...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900">Payment successful!</h1>
            <p className="text-gray-600">
              Your subscription is now active. Redirecting to dashboard...
            </p>
          </div>
        )}

        {status === 'cancel' && (
          <div className="space-y-4">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900">Payment canceled</h1>
            <p className="text-gray-600">
              You can try again whenever you're ready.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Back to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
