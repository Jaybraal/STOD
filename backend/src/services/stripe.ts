import Stripe from 'stripe';
import { getFirestore } from 'firebase-admin/firestore';
import { PlanId } from '../types/subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const PLAN_PRICE_ENV_VARS: Record<PlanId, string> = {
  basico: 'STRIPE_PRICE_BASICO',
  clinica: 'STRIPE_PRICE_CLINICA',
  clinica_plus: 'STRIPE_PRICE_CLINICA_PLUS',
};

export function isValidPlanId(value: unknown): value is PlanId {
  return value === 'basico' || value === 'clinica' || value === 'clinica_plus';
}

// Traduce un planId elegido por el cliente al Price ID real de Stripe,
// vía variable de entorno — nunca confía en un priceId que venga directo
// del cliente.
export function resolvePlanPriceId(planId: unknown): string {
  if (!isValidPlanId(planId)) {
    throw new Error(`planId inválido: ${String(planId)}`);
  }

  const envVar = PLAN_PRICE_ENV_VARS[planId];
  const priceId = process.env[envVar];

  if (!priceId) {
    throw new Error(`Falta configurar la variable de entorno ${envVar}`);
  }

  return priceId;
}

export async function createOrGetStripeCustomer(uid: string, email: string) {
  try {
    const db = getFirestore();
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    let stripeCustomerId = userSnap.data()?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { uid },
      });
      stripeCustomerId = customer.id;

      await userRef.update({ stripeCustomerId });
    }

    return stripeCustomerId;
  } catch (error) {
    console.error('Error creating/getting Stripe customer:', error);
    throw error;
  }
}

export async function createCheckoutSession(
  uid: string,
  email: string,
  successUrl: string,
  cancelUrl: string,
  planId: PlanId
) {
  try {
    const priceId = resolvePlanPriceId(planId);
    const customerId = await createOrGetStripeCustomer(uid, email);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { uid, planId },
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function getStripeEvent(
  body: Buffer | string,
  signature: string
): Promise<Stripe.Event | null> {
  try {
    const event = stripe.webhooks.constructEvent(
      body as any,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
    return event;
  } catch (error) {
    console.error('Error constructing webhook event:', error);
    return null;
  }
}

export async function handleSubscriptionCreated(stripeSubscription: Stripe.Subscription) {
  try {
    const db = getFirestore();
    const uid = stripeSubscription.metadata?.uid as string;

    if (!uid) {
      console.warn('Subscription created without uid metadata:', stripeSubscription.id);
      return;
    }

    const subscriptionRef = db.collection('subscriptions').doc(uid);
    const data = stripeSubscription as any;
    const planId = data.metadata?.planId;
    await subscriptionRef.set(
      {
        stripeSubscriptionId: stripeSubscription.id,
        status: stripeSubscription.status,
        ...(isValidPlanId(planId) ? { planId } : {}),
        currentPeriodStart: (data.current_period_start as number) * 1000,
        currentPeriodEnd: (data.current_period_end as number) * 1000,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

export async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  try {
    const db = getFirestore();
    const uid = stripeSubscription.metadata?.uid as string;

    if (!uid) {
      console.warn('Subscription updated without uid metadata:', stripeSubscription.id);
      return;
    }

    const subscriptionRef = db.collection('subscriptions').doc(uid);
    const data = stripeSubscription as any;
    await subscriptionRef.update({
      status: stripeSubscription.status,
      currentPeriodStart: (data.current_period_start as number) * 1000,
      currentPeriodEnd: (data.current_period_end as number) * 1000,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const db = getFirestore();
    const uid = subscription.metadata?.uid as string;

    if (!uid) {
      console.warn('Subscription deleted without uid metadata:', subscription.id);
      return;
    }

    const subscriptionRef = db.collection('subscriptions').doc(uid);
    await subscriptionRef.update({
      status: 'canceled',
      canceledAt: Date.now(),
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}
