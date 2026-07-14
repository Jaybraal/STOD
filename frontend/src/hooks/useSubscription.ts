import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { PlanId } from '../constants/plans';

export interface TrialStatus {
  isTrialActive: boolean;
  minutesRemaining: number;
  expiresAt: number;
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';
}

interface CheckoutResult {
  sessionId: string;
  url: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getIdToken = useCallback(async (): Promise<string> => {
    if (!user) throw new Error('No user authenticated');
    return user.getIdToken();
  }, [user]);

  const initializeSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getIdToken();
      const response = await fetch('/api/auth/initialize-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize subscription');
      }

      await fetchTrialStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error initializing subscription:', err);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  const fetchTrialStatus = useCallback(async () => {
    try {
      if (!user) return;

      const token = await getIdToken();
      const response = await fetch('/api/auth/trial-status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trial status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Error fetching trial status:', err);
      setStatus(null);
    }
  }, [user, getIdToken]);

  const createCheckoutSession = useCallback(
    async (successUrl: string, cancelUrl: string, planId: PlanId): Promise<CheckoutResult> => {
      try {
        const token = await getIdToken();
        const response = await fetch('/api/auth/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ successUrl, cancelUrl, planId }),
        });

        if (!response.ok) {
          throw new Error('Failed to create checkout session');
        }

        return response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      }
    },
    [getIdToken]
  );

  // Poll trial status every 30 seconds
  useEffect(() => {
    if (!user) {
      setStatus(null);
      return;
    }

    fetchTrialStatus();
    const interval = setInterval(fetchTrialStatus, 30000);

    return () => clearInterval(interval);
  }, [user, fetchTrialStatus]);

  return {
    status,
    loading,
    error,
    initializeSubscription,
    fetchTrialStatus,
    createCheckoutSession,
    isTrialActive: status?.isTrialActive ?? false,
    isPaid: status?.status === 'active' || status?.status === 'past_due',
  };
}
