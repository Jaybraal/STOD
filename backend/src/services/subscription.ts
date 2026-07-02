import { getFirestore } from 'firebase-admin/firestore';
import { Subscription, TrialStatus, SubscriptionCheckResult } from '../types/subscription';

const TRIAL_DURATION_MS = 30 * 60 * 1000; // 30 minutos

export async function initializeUserSubscription(uid: string): Promise<Subscription> {
  try {
    const db = getFirestore();
    const subscriptionRef = db.collection('subscriptions').doc(uid);

    const now = Date.now();
    const trialExpiresAt = now + TRIAL_DURATION_MS;

    const subscription: Subscription = {
      uid,
      status: 'trial',
      trialStartedAt: now,
      trialExpiresAt,
      createdAt: now,
      updatedAt: now,
    };

    await subscriptionRef.set(subscription);
    return subscription;
  } catch (error) {
    console.error('Error initializing user subscription:', error);
    throw error;
  }
}

export async function getSubscription(uid: string): Promise<Subscription | null> {
  try {
    const db = getFirestore();
    const subscriptionRef = db.collection('subscriptions').doc(uid);
    const snap = await subscriptionRef.get();

    if (!snap.exists) {
      return null;
    }

    return snap.data() as Subscription;
  } catch (error) {
    console.error('Error getting subscription:', error);
    throw error;
  }
}

export async function getTrialStatus(uid: string): Promise<TrialStatus> {
  try {
    const subscription = await getSubscription(uid);

    if (!subscription) {
      return {
        isTrialActive: false,
        minutesRemaining: 0,
        expiresAt: 0,
        status: 'expired',
      };
    }

    const now = Date.now();
    const minutesRemaining = Math.max(
      0,
      Math.floor((subscription.trialExpiresAt - now) / 60000)
    );
    const isTrialActive = subscription.status === 'trial' && minutesRemaining > 0;

    return {
      isTrialActive,
      minutesRemaining,
      expiresAt: subscription.trialExpiresAt,
      status: subscription.status,
    };
  } catch (error) {
    console.error('Error getting trial status:', error);
    throw error;
  }
}

export async function checkSubscriptionAccess(
  uid: string,
  action: 'read' | 'write'
): Promise<SubscriptionCheckResult> {
  try {
    const subscription = await getSubscription(uid);

    if (!subscription) {
      return {
        canWrite: false,
        canRead: false,
        status: 'expired',
        trialMinutesRemaining: 0,
      };
    }

    const now = Date.now();
    const minutesRemaining = Math.max(
      0,
      Math.floor((subscription.trialExpiresAt - now) / 60000)
    );

    const isTrialActive = subscription.status === 'trial' && minutesRemaining > 0;
    const isPaid =
      subscription.status === 'active' || subscription.status === 'past_due';

    let canWrite = false;
    let canRead = false;

    if (action === 'write') {
      canWrite = isPaid;
    } else if (action === 'read') {
      canRead = isTrialActive || isPaid;
    }

    return {
      canWrite,
      canRead,
      status: subscription.status,
      trialMinutesRemaining: minutesRemaining,
    };
  } catch (error) {
    console.error('Error checking subscription access:', error);
    throw error;
  }
}
