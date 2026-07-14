export type PlanId = 'basico' | 'clinica' | 'clinica_plus';

export interface Subscription {
  uid: string;
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';
  planId?: PlanId;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialStartedAt: number;
  trialExpiresAt: number;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  canceledAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface TrialStatus {
  isTrialActive: boolean;
  minutesRemaining: number;
  expiresAt: number;
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';
}

export interface SubscriptionCheckResult {
  canWrite: boolean;
  canRead: boolean;
  status: string;
  trialMinutesRemaining: number;
}
