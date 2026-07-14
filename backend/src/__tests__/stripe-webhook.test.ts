import { describe, it, expect, beforeEach, vi } from 'vitest';

const { store } = vi.hoisted(() => ({ store: {} as Record<string, any> }));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: (name: string) => ({
      doc: (id: string) => ({
        set: async (data: any, options?: { merge?: boolean }) => {
          const key = `${name}/${id}`;
          store[key] = options?.merge ? { ...store[key], ...data } : data;
        },
      }),
    }),
  }),
}));

import { handleSubscriptionCreated } from '../services/stripe';

function fakeStripeSubscription(overrides: Record<string, any> = {}) {
  return {
    id: 'sub_123',
    status: 'active',
    metadata: { uid: 'owner-1', planId: 'clinica' },
    current_period_start: 1000,
    current_period_end: 2000,
    ...overrides,
  } as any;
}

describe('handleSubscriptionCreated — persistencia de planId', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
  });

  it('guarda el planId cuando viene en los metadata de Stripe', async () => {
    await handleSubscriptionCreated(fakeStripeSubscription());
    expect(store['subscriptions/owner-1'].planId).toBe('clinica');
  });

  it('no guarda planId si el valor de metadata no es uno de los 3 planes válidos', async () => {
    await handleSubscriptionCreated(
      fakeStripeSubscription({ metadata: { uid: 'owner-2', planId: 'inventado' } })
    );
    expect(store['subscriptions/owner-2'].planId).toBeUndefined();
  });

  it('no rompe si no hay planId en metadata (suscripciones viejas antes de este cambio)', async () => {
    await handleSubscriptionCreated(
      fakeStripeSubscription({ metadata: { uid: 'owner-3' } })
    );
    expect(store['subscriptions/owner-3'].planId).toBeUndefined();
    expect(store['subscriptions/owner-3'].status).toBe('active');
  });
});
