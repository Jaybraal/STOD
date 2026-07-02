import { useState } from 'react';
import type { ReactNode } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { Paywall } from './Paywall';
import { TrialTimer } from './TrialTimer';

interface SubscriptionGateProps {
  children: ReactNode;
  requiredFor?: 'read' | 'write';
  showTrialTimer?: boolean;
  fallback?: ReactNode;
}

export function SubscriptionGate({
  children,
  requiredFor = 'write',
  showTrialTimer = true,
  fallback = null,
}: SubscriptionGateProps) {
  const { status, loading, isTrialActive, isPaid, createCheckoutSession } =
    useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const hasAccess =
    requiredFor === 'read'
      ? isTrialActive || isPaid
      : isPaid;

  const handleUpgrade = async () => {
    try {
      setCheckoutLoading(true);
      const { url } = await createCheckoutSession(
        window.location.href,
        window.location.href
      );
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return fallback || <div className="p-4 text-center text-gray-500">Loading...</div>;
  }

  // For read access, allow trial + paid
  if (requiredFor === 'read' && !hasAccess && !isTrialActive && !isPaid) {
    return (
      <>
        <Paywall onUpgrade={handleUpgrade} loading={checkoutLoading} />
        {fallback || <div className="p-4 text-center text-gray-500">Subscription required</div>}
      </>
    );
  }

  // For write access, only allow paid
  if (requiredFor === 'write' && !isPaid) {
    if (isTrialActive && showTrialTimer) {
      return (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Dashboard</h2>
            <TrialTimer
              minutesRemaining={status?.minutesRemaining || 0}
              onExpired={() => window.location.reload()}
            />
          </div>
          {fallback || children}
          <Paywall
            onUpgrade={handleUpgrade}
            loading={checkoutLoading}
            description="Your trial is ending. Subscribe now to continue using STOD."
          />
        </div>
      );
    }

    return (
      <>
        <Paywall onUpgrade={handleUpgrade} loading={checkoutLoading} />
        {fallback || <div className="p-4 text-center text-gray-500">Subscription required</div>}
      </>
    );
  }

  // If has access, show trial timer if active and showTrialTimer is true
  if (isTrialActive && showTrialTimer && !isPaid) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div />
          <TrialTimer
            minutesRemaining={status?.minutesRemaining || 0}
            onExpired={() => window.location.reload()}
          />
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
