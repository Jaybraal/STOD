import { describe, it, expect, vi, beforeEach } from 'vitest';

const { store } = vi.hoisted(() => ({ store: {} as Record<string, any> }));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: (name: string) => ({
      doc: (id: string) => ({
        get: async () => {
          const data = store[`${name}/${id}`];
          return {
            exists: data !== undefined,
            data: () => data,
          };
        },
      }),
    }),
  }),
}));

import { checkSubscriptionAccess } from '../services/subscription';

function setSubscription(uid: string, status: string) {
  const now = Date.now();
  store[`subscriptions/${uid}`] = {
    uid,
    status,
    trialStartedAt: now,
    trialExpiresAt: now + 1000,
    createdAt: now,
    updatedAt: now,
  };
}

function setStaffUser(uid: string, clinicId: string) {
  store[`users/${uid}`] = { clinicId, role: 'member', status: 'active' };
}

describe('checkSubscriptionAccess — resolución por clínica, no por usuario', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
  });

  it('el dueño de una clínica con suscripción activa tiene acceso de escritura', async () => {
    setSubscription('owner-1', 'active');

    const result = await checkSubscriptionAccess('owner-1', 'write');

    expect(result.canWrite).toBe(true);
  });

  it('un miembro del personal cuyo dueño tiene suscripción activa también tiene acceso (bug: antes fallaba)', async () => {
    setSubscription('owner-2', 'active');
    setStaffUser('staff-2', 'owner-2');
    // staff-2 nunca tiene su propio doc en subscriptions/ — antes del fix esto bloqueaba

    const result = await checkSubscriptionAccess('staff-2', 'write');

    expect(result.canWrite).toBe(true);
  });

  it('un miembro del personal cuyo dueño NO tiene suscripción activa sigue bloqueado', async () => {
    setSubscription('owner-3', 'canceled');
    setStaffUser('staff-3', 'owner-3');

    const result = await checkSubscriptionAccess('staff-3', 'write');

    expect(result.canWrite).toBe(false);
    expect(result.status).toBe('canceled');
  });

  it('un usuario sin clínica asociada y sin suscripción propia no rompe, queda sin acceso', async () => {
    const result = await checkSubscriptionAccess('usuario-huerfano', 'read');

    expect(result.canRead).toBe(false);
    expect(result.status).toBe('expired');
  });
});
